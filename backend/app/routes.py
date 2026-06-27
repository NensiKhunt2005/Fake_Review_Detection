from fastapi import APIRouter, HTTPException
from .schemas import (
    ReviewRequest, 
    PredictionResponse, 
    BatchReviewRequest, 
    BatchPredictionResponse, 
    TrustScoreResponse,
    PredictionDetail
)
from .model_loader import loader
from .utils import get_explanation
from typing import List

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict_review(request: ReviewRequest):
    if not request.review_text.strip():
        raise HTTPException(status_code=400, detail="Review text cannot be empty")
    
    try:
        result = loader.predict(request.review_text)
        explanation = get_explanation(request.review_text, loader.model, loader.tokenizer)
        return PredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            explanation=explanation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(request: BatchReviewRequest):
    results = []
    for text in request.reviews:
        if not text.strip():
            continue
        try:
            result = loader.predict(text)
            # For batch, we might skip explanation to save time, or include it if requested
            # The prompt requested AI explanations in dashboard, so we include it
            explanation = get_explanation(text, loader.model, loader.tokenizer)
            results.append(PredictionDetail(
                review_text=text,
                prediction=result["prediction"],
                confidence=result["confidence"],
                explanation=explanation
            ))
        except Exception:
            continue
    return BatchPredictionResponse(results=results)

@router.post("/trust-score", response_model=TrustScoreResponse)
async def get_trust_score(request: BatchReviewRequest):
    if not request.reviews:
        raise HTTPException(status_code=400, detail="No reviews provided")
    
    results = []
    genuine_count = 0
    fake_count = 0
    
    # Process reviews for predictions first
    predictions = []
    for text in request.reviews:
        if not text.strip():
            continue
        try:
            result = loader.predict(text)
            predictions.append({"text": text, "result": result})
            if result["prediction"] == "Genuine":
                genuine_count += 1
            else:
                fake_count += 1
        except Exception:
            continue

    # Selective explanation: Only for suspicious reviews, capped to 5
    fake_reviews = [p for p in predictions if p["result"]["prediction"] == "Fake"]
    # Sort by confidence descending to explain the most suspicious ones
    fake_reviews.sort(key=lambda x: x["result"]["confidence"], reverse=True)
    
    explained_count = 0
    for p in predictions:
        text = p["text"]
        result = p["result"]
        explanation = None
        
        # Explain if it's one of the top 5 Fake reviews
        if result["prediction"] == "Fake" and explained_count < 5:
            try:
                explanation = get_explanation(text, loader.model, loader.tokenizer)
                explained_count += 1
            except Exception:
                explanation = {}
        
        detail = PredictionDetail(
            review_text=text,
            prediction=result["prediction"],
            confidence=result["confidence"],
            explanation=explanation
        )
        results.append(detail)
            
    total = len(results)
    if total == 0:
         return TrustScoreResponse(
            trust_score=0,
            genuine_percentage=0,
            suspicious_percentage=0,
            total_reviews=0,
            results=[],
            risk_indicators=[]
        )
        
    genuine_percentage = (genuine_count / total) * 100
    suspicious_percentage = (fake_count / total) * 100
    trust_score = (genuine_count / total) * 10
    
    # Simple risk indicators logic
    risk_indicators = []
    if suspicious_percentage > 20:
        risk_indicators.append("High volume of suspicious reviews")
    if any(res.confidence > 0.9 and res.prediction == "Fake" for res in results):
        risk_indicators.append("Highly probable bot patterns detected")
    if total < 5:
        risk_indicators.append("Low review count (Sample size too small)")

    return TrustScoreResponse(
        trust_score=round(trust_score, 1),
        genuine_percentage=round(genuine_percentage, 1),
        suspicious_percentage=round(suspicious_percentage, 1),
        total_reviews=total,
        results=results,
        risk_indicators=risk_indicators
    )


@router.get("/health")
async def health_check():
    return {"status": "ok"}
