# Fake Review Detector

AI-powered review trust analysis for Amazon and Flipkart product pages.

The system extracts publicly visible reviews with a Chrome Extension, sends them to a FastAPI backend, classifies each review with a fine-tuned BERT model, calculates a product Trust Score, and displays results in both the extension popup and a Next.js analytics dashboard.

## Scope

This project is only for review extraction, AI analysis, visualization, and explainable recommendations.

It intentionally does not include login, registration, authentication, user profiles, payment flows, admin panels, or email verification.

## Architecture

Amazon or Flipkart product page -> Chrome Extension -> FastAPI -> BERT model -> Trust Score engine -> Extension popup -> Next.js dashboard

## Project Structure

- `backend/` FastAPI app, schemas, model loader, trust-score engine, logging, tests
- `extension/` Manifest V3 Chrome Extension for review extraction and popup UI
- `frontend/` Next.js dashboard and manual review analyzer
- `ml/` data generation, preprocessing, training, and evaluation scripts
- `docs/` project rules and supporting documentation

## Backend

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
python3 -m backend.app.main
```

OpenAPI docs:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

Implemented endpoints are available both at the required root paths and under `/api` for compatibility:

- `POST /predict`
- `POST /batch-predict`
- `POST /trust-score`
- `POST /analyze-url`
- `GET /health`

Request example:

```json
{
  "product_name": "Example product",
  "product_rating": 4.3,
  "site": "Amazon",
  "source_url": "https://www.amazon.com/example",
  "reviews": ["Good quality and arrived on time."]
}
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard URL:

```text
http://localhost:3000/dashboard
```

The dashboard reads the latest extension analysis from the URL hash or `localStorage`.

## Optional Deep Scraping Service

For the best extension experience, run the separate `Review_Scraping` service on port `8001`.

```bash
cd ../Review_Scraping
venv/bin/uvicorn src.main:app --port 8001
```

The Chrome Extension still analyzes visible reviews directly through `/trust-score`.
If fewer than 5 visible reviews are found, it calls `/analyze-url`; the backend then tries:

```text
http://127.0.0.1:8001/api/v1/scrape
```

If the scraper service is unavailable, the backend falls back to any visible reviews already extracted by the extension. This keeps the original working flow safe.

## Chrome Extension

1. Start the backend on `http://localhost:8000`.
2. Start the dashboard on `http://localhost:3000`.
3. Open Chrome and go to `chrome://extensions/`.
4. Enable Developer mode.
5. Load the `extension/` folder as an unpacked extension.
6. Open an Amazon or Flipkart product page with visible reviews.
7. Click the extension and select `Analyze`.

The extension does not modify product pages, replace ratings, or edit reviews.

## Machine Learning

The training scripts are in `ml/scripts`.

```bash
python3 ml/scripts/generate_data.py
python3 ml/scripts/preprocess.py
python3 ml/scripts/train.py
python3 ml/scripts/evaluate.py
```

The included synthetic dataset is useful for demonstrating the pipeline. For production-quality detection, replace it with a real labeled review dataset and validate model performance before deployment.

## Environment Variables

- `APP_NAME` API display name
- `API_HOST` backend host, default `0.0.0.0`
- `API_PORT` backend port, default `8000`
- `CORS_ORIGINS` comma-separated allowed origins, default `*`
- `MODEL_PATH` path to fine-tuned BERT model
- `TOKENIZER_PATH` path to tokenizer
- `MAX_REVIEWS` maximum reviews per request, default `100`
- `EXPLANATION_LIMIT` max LIME explanations for trust-score requests, default `8`
- `SCRAPER_API_URL` review scraping API URL, default `http://127.0.0.1:8001/api/v1/scrape`
- `SCRAPER_TIMEOUT_SECONDS` scraper request timeout, default `90`
- `MIN_VISIBLE_REVIEWS_BEFORE_SCRAPER` extension fallback threshold, default `5`

## Verification

```bash
python3 -m compileall backend/app ml/scripts
python3 -m unittest backend.tests.test_api_contract
cd frontend && npm run build
```

## Future Improvements

- Add real Amazon and Flipkart selector regression fixtures.
- Add extension end-to-end tests with saved product-page HTML.
- Replace synthetic training data with a validated dataset.
- Add Docker and deployment manifests.
- Add SHAP as an alternate explanation provider.
