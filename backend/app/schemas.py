from pydantic import BaseModel
from typing import List, Optional

class ReviewRequest(BaseModel):
    review_text: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    explanation: Optional[dict] = None

class BatchReviewRequest(BaseModel):
    reviews: List[str]

class PredictionDetail(BaseModel):
    review_text: str
    prediction: str
    confidence: float
    explanation: Optional[dict] = None

class BatchPredictionResponse(BaseModel):
    results: List[PredictionDetail]

class TrustScoreResponse(BaseModel):
    product_name: Optional[str] = "Product"
    trust_score: float
    genuine_percentage: float
    suspicious_percentage: float
    total_reviews: int
    results: List[PredictionDetail]
    risk_indicators: List[str]
