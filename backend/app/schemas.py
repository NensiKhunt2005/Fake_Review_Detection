from pydantic import BaseModel, Field, validator
from typing import List, Optional

class ReviewRequest(BaseModel):
    review_text: str = Field(..., min_length=1, max_length=5000)

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probability: float
    explanation: Optional[dict] = None
    highlighted_words: List[str] = []
    reasons: List[str] = []

class BatchReviewRequest(BaseModel):
    reviews: List[str] = Field(..., min_items=1, max_items=100)
    product_name: Optional[str] = Field(default="Product", max_length=300)
    product_rating: Optional[float] = Field(default=None, ge=0, le=5)
    source_url: Optional[str] = Field(default=None, max_length=2000)
    site: Optional[str] = Field(default=None, max_length=50)

    @validator("reviews")
    def require_non_empty_reviews(cls, reviews):
        cleaned = [review for review in reviews if isinstance(review, str) and review.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty review is required")
        return reviews

class AnalyzeUrlRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=2000)
    product_name: Optional[str] = Field(default="Product", max_length=300)
    product_rating: Optional[float] = Field(default=None, ge=0, le=5)
    site: Optional[str] = Field(default=None, max_length=50)
    visible_reviews: List[str] = Field(default_factory=list, max_items=100)
    max_pages: Optional[int] = Field(default=1, ge=1, le=5)

class PredictionDetail(BaseModel):
    review_text: str
    prediction: str
    confidence: float
    probability: float
    explanation: Optional[dict] = None
    highlighted_words: List[str] = []
    reasons: List[str] = []

class BatchPredictionResponse(BaseModel):
    results: List[PredictionDetail]

class TrustScoreResponse(BaseModel):
    product_name: Optional[str] = "Product"
    product_rating: Optional[float] = None
    site: Optional[str] = None
    source_url: Optional[str] = None
    trust_score: float
    genuine_percentage: float
    suspicious_percentage: float
    average_confidence: float
    duplicate_percentage: float = 0
    overall_recommendation: str
    total_reviews: int
    results: List[PredictionDetail]
    risk_indicators: List[str]
    statistics: dict = {}
    extraction_source: Optional[str] = None
