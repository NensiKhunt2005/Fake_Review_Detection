from fastapi import APIRouter, HTTPException
from .schemas import (
    ReviewRequest, 
    PredictionResponse, 
    BatchReviewRequest, 
    BatchPredictionResponse, 
    TrustScoreResponse,
    PredictionDetail,
    AnalyzeUrlRequest
)
from .model_loader import loader
from .utils import get_explanation
from .logging_config import logger
from .trust_score import calculate_trust_score, build_reasons, highlighted_words
from .config import settings
from .scraper_client import ScraperClientError, scrape_reviews_from_url
from .review_filter import filter_review_texts
import time

router = APIRouter()


def build_prediction_detail(text, result, explanation=None):
    return PredictionDetail(
        review_text=text,
        prediction=result["prediction"],
        confidence=result["confidence"],
        probability=result["probability"],
        explanation=explanation,
        highlighted_words=highlighted_words(explanation),
        reasons=build_reasons(result["prediction"], result["confidence"], explanation)
    )


def empty_trust_score_response(
    product_name="Product",
    product_rating=None,
    site=None,
    source_url=None,
    extraction_source=None,
):
    return TrustScoreResponse(
        product_name=product_name or "Product",
        product_rating=product_rating,
        site=site,
        source_url=source_url,
        trust_score=0,
        genuine_percentage=0,
        suspicious_percentage=0,
        average_confidence=0,
        duplicate_percentage=0,
        overall_recommendation="Not enough review data",
        total_reviews=0,
        results=[],
        risk_indicators=["No valid reviews were available for analysis"],
        statistics={},
        extraction_source=extraction_source,
    )


def analyze_reviews(
    reviews,
    product_name="Product",
    product_rating=None,
    site=None,
    source_url=None,
    extraction_source="visible_page",
):
    results = []
    predictions = []
    filtered_reviews = filter_review_texts(reviews, limit=settings.max_reviews)
    valid_reviews = []

    for text in filtered_reviews:
        try:
            result = loader.predict(text)
            valid_reviews.append(text)
            predictions.append({"text": text, "result": result})
        except Exception as e:
            logger.error("Failed to process prediction item: %s", str(e))
            continue

    explanation_targets = {
        id(item)
        for item in sorted(
            predictions,
            key=lambda item: (
                item["result"]["prediction"] != "Fake",
                -item["result"]["confidence"]
            )
        )[:settings.explanation_limit]
    }

    for p in predictions:
        text = p["text"]
        result = p["result"]
        explanation = None

        if id(p) in explanation_targets:
            try:
                explanation = get_explanation(text, loader.model, loader.tokenizer)
            except Exception as e:
                logger.error("Failed to generate LIME explanation: %s", str(e))
                explanation = {}

        results.append(build_prediction_detail(text, result, explanation))

    total = len(results)
    if total == 0:
        logger.warning("No valid reviews processed for trust-score calculation")
        return empty_trust_score_response(
            product_name=product_name,
            product_rating=product_rating,
            site=site,
            source_url=source_url,
            extraction_source=extraction_source,
        )

    score = calculate_trust_score(
        [p["result"] for p in predictions],
        valid_reviews,
        product_rating=product_rating
    )
    statistics = {
        **score["statistics"],
        "extraction_source": extraction_source,
    }

    return TrustScoreResponse(
        product_name=product_name or "Product",
        product_rating=product_rating,
        site=site,
        source_url=source_url,
        trust_score=score["trust_score"],
        genuine_percentage=score["genuine_percentage"],
        suspicious_percentage=score["suspicious_percentage"],
        average_confidence=score["average_confidence"],
        duplicate_percentage=score["duplicate_percentage"],
        overall_recommendation=score["overall_recommendation"],
        total_reviews=total,
        results=results,
        risk_indicators=score["risk_indicators"],
        statistics=statistics,
        extraction_source=extraction_source,
    )

@router.post("/predict", response_model=PredictionResponse)
async def predict_review(request: ReviewRequest):
    if not request.review_text.strip():
        logger.warning("Empty review text received on /predict")
        raise HTTPException(status_code=400, detail="Review text cannot be empty")
    
    start_time = time.time()
    logger.info("Processing /predict request. Review preview: %s", request.review_text[:60])
    try:
        result = loader.predict(request.review_text)
        explanation = get_explanation(request.review_text, loader.model, loader.tokenizer)
        duration = time.time() - start_time
        logger.info(
            "Prediction complete: %s | Confidence: %.2f | Time: %.4fs",
            result["prediction"],
            result["confidence"],
            duration
        )
        return PredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            probability=result["probability"],
            explanation=explanation,
            highlighted_words=highlighted_words(explanation),
            reasons=build_reasons(result["prediction"], result["confidence"], explanation)
        )
    except Exception as e:
        logger.error("Exception in /predict: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(request: BatchReviewRequest):
    start_time = time.time()
    logger.info("Processing /batch-predict request with %d reviews", len(request.reviews))
    results = []
    for text in request.reviews[:settings.max_reviews]:
        if not text.strip():
            continue
        try:
            result = loader.predict(text)
            explanation = get_explanation(text, loader.model, loader.tokenizer)
            results.append(build_prediction_detail(text, result, explanation))
        except Exception as e:
            logger.error("Failed to predict batch item: %s", str(e))
            continue
    duration = time.time() - start_time
    logger.info("Batch prediction complete. Processed %d items in %.4fs", len(results), duration)
    return BatchPredictionResponse(results=results)

@router.post("/trust-score", response_model=TrustScoreResponse)
async def get_trust_score(request: BatchReviewRequest):
    if not request.reviews:
        logger.warning("Empty batch request received on /trust-score")
        raise HTTPException(status_code=400, detail="No reviews provided")
    
    start_time = time.time()
    logger.info("Processing /trust-score request with %d reviews", len(request.reviews))
    response = analyze_reviews(
        request.reviews,
        product_name=request.product_name,
        product_rating=request.product_rating,
        site=request.site,
        source_url=request.source_url,
        extraction_source="visible_page",
    )

    duration = time.time() - start_time
    logger.info(
        "Trust-score complete. Total reviews: %d | Genuine %%: %.1f | Suspicious %%: %.1f | Trust Score: %.1f | Time: %.4fs",
        response.total_reviews,
        response.genuine_percentage,
        response.suspicious_percentage,
        response.trust_score,
        duration
    )

    return response


@router.post("/analyze-url", response_model=TrustScoreResponse)
async def analyze_product_url(request: AnalyzeUrlRequest):
    visible_reviews = filter_review_texts(
        request.visible_reviews,
        limit=settings.max_reviews
    )
    start_time = time.time()
    logger.info(
        "Processing /analyze-url request. Visible reviews: %d | URL: %s",
        len(visible_reviews),
        request.url
    )

    scraped_reviews = []
    scraper_website = None
    scraper_error = None

    try:
        scraped = scrape_reviews_from_url(str(request.url), max_pages=request.max_pages)
        scraped_reviews = scraped["reviews"]
        scraper_website = scraped["website"]
        logger.info(
            "Scraper API returned %d reviews via %s",
            len(scraped_reviews),
            scraper_website
        )
    except ScraperClientError as exc:
        scraper_error = str(exc)
        logger.warning("Scraper fallback unavailable: %s", scraper_error)

    selected_reviews = scraped_reviews or visible_reviews
    extraction_source = "deep_scraper" if scraped_reviews else "visible_page_fallback"

    if not selected_reviews:
        raise HTTPException(
            status_code=503,
            detail=(
                "No visible reviews were available and the scraping service "
                "could not return reviews. Start Review_Scraping on port 8001 "
                "or open visible reviews on the product page."
            )
        )

    response = analyze_reviews(
        selected_reviews,
        product_name=request.product_name,
        product_rating=request.product_rating,
        site=request.site or scraper_website,
        source_url=request.url,
        extraction_source=extraction_source,
    )
    response.statistics = {
        **response.statistics,
        "visible_reviews_supplied": len(visible_reviews),
        "scraped_reviews_supplied": len(scraped_reviews),
        "scraper_website": scraper_website,
        "scraper_error": scraper_error,
    }

    duration = time.time() - start_time
    logger.info(
        "Analyze-url complete. Source: %s | Reviews: %d | Trust Score: %.1f | Time: %.4fs",
        response.extraction_source,
        response.total_reviews,
        response.trust_score,
        duration
    )

    return response


@router.get("/health")
async def health_check():
    return {"status": "ok"}
