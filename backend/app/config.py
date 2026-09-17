import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings:
    app_name = os.getenv("APP_NAME", "Fake Review Detection API")
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))
    cors_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]
    model_path = os.getenv("MODEL_PATH", str(BASE_DIR / "model" / "bert_model"))
    tokenizer_path = os.getenv("TOKENIZER_PATH", str(BASE_DIR / "model" / "tokenizer"))
    max_reviews = int(os.getenv("MAX_REVIEWS", "100"))
    explanation_limit = int(os.getenv("EXPLANATION_LIMIT", "8"))
    min_visible_reviews_before_scraper = int(
        os.getenv("MIN_VISIBLE_REVIEWS_BEFORE_SCRAPER", "5")
    )
    scraper_api_url = os.getenv(
        "SCRAPER_API_URL",
        "http://127.0.0.1:8001/api/v1/scrape"
    )
    scraper_timeout_seconds = int(os.getenv("SCRAPER_TIMEOUT_SECONDS", "90"))


settings = Settings()
