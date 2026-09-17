import unittest
from unittest.mock import patch

from pydantic import ValidationError

from backend.app.main import app
from backend.app.routes import analyze_product_url
from backend.app.schemas import AnalyzeUrlRequest, BatchReviewRequest, TrustScoreResponse
from backend.app.scraper_client import ScraperClientError
from backend.app.trust_score import calculate_trust_score
from backend.app.review_filter import filter_review_texts


class ApiContractTest(unittest.TestCase):
    def test_required_routes_are_registered_at_root_and_api_prefix(self):
        paths = {route.path for route in app.routes}
        for path in ["/predict", "/batch-predict", "/trust-score", "/analyze-url", "/health"]:
            self.assertIn(path, paths)
            self.assertIn(f"/api{path}", paths)

    def test_batch_request_rejects_empty_review_list(self):
        with self.assertRaises(ValidationError):
            BatchReviewRequest(reviews=["   "])

    def test_trust_score_penalizes_suspicious_and_duplicate_reviews(self):
        reviews = ["Amazing product buy now", "Amazing product buy now", "Worked as expected"]
        predictions = [
            {"prediction": "Fake", "confidence": 0.94},
            {"prediction": "Fake", "confidence": 0.91},
            {"prediction": "Genuine", "confidence": 0.78},
        ]
        score = calculate_trust_score(predictions, reviews, product_rating=4.8)

        self.assertLess(score["trust_score"], 5)
        self.assertGreater(score["suspicious_percentage"], 60)
        self.assertGreater(score["duplicate_percentage"], 0)
        self.assertTrue(score["risk_indicators"])

    def test_review_filter_removes_page_text_and_keeps_review_text(self):
        reviews = filter_review_texts([
            "Add to cart Buy now FREE delivery Wednesday",
            "The webpage at https://example.com might be temporarily down or it may have moved permanently to a new web address.",
            "I bought this product last week and the quality is excellent for daily use.",
        ])

        self.assertEqual(
            reviews,
            ["I bought this product last week and the quality is excellent for daily use."]
        )

    def test_review_filter_rejects_a_merged_review_section(self):
        merged_section = (
            "Customers say the shelf is useful. AI Generated from the text of "
            "customer reviews. Top reviews from India Aryan 5 out of 5 stars "
            "Reviewed in India on 10 January 2026 Verified Purchase Handy bag. "
            "Helpful Report Palak 5 out of 5 stars Reviewed in India on 27 July "
            "2026 Verified Purchase Not good quality."
        )

        self.assertEqual(filter_review_texts([merged_section]), [])

    def test_analyze_url_prefers_scraped_reviews_when_available(self):
        request = AnalyzeUrlRequest(
            url="https://amazon.in/example",
            visible_reviews=["I bought this product and the quality is good for daily use."],
        )

        def fake_analysis(reviews, **kwargs):
            return TrustScoreResponse(
                product_name="Product",
                trust_score=8,
                genuine_percentage=100,
                suspicious_percentage=0,
                average_confidence=0.9,
                overall_recommendation="ok",
                total_reviews=len(reviews),
                results=[],
                risk_indicators=[],
                statistics={"received_reviews": reviews},
                extraction_source=kwargs["extraction_source"],
            )

        with patch(
            "backend.app.routes.scrape_reviews_from_url",
            return_value={"website": "AmazonScraper", "reviews": ["scraped review"]},
        ), patch("backend.app.routes.analyze_reviews", side_effect=fake_analysis):
            response = run_async(analyze_product_url(request))

        self.assertEqual(response.extraction_source, "deep_scraper")
        self.assertEqual(response.statistics["received_reviews"], ["scraped review"])

    def test_analyze_url_falls_back_to_visible_reviews_when_scraper_fails(self):
        request = AnalyzeUrlRequest(
            url="https://amazon.in/example",
            visible_reviews=["I bought this product and the quality is good for daily use."],
        )

        def fake_analysis(reviews, **kwargs):
            return TrustScoreResponse(
                product_name="Product",
                trust_score=7,
                genuine_percentage=100,
                suspicious_percentage=0,
                average_confidence=0.8,
                overall_recommendation="ok",
                total_reviews=len(reviews),
                results=[],
                risk_indicators=[],
                statistics={"received_reviews": reviews},
                extraction_source=kwargs["extraction_source"],
            )

        with patch(
            "backend.app.routes.scrape_reviews_from_url",
            side_effect=ScraperClientError("down"),
        ), patch("backend.app.routes.analyze_reviews", side_effect=fake_analysis):
            response = run_async(analyze_product_url(request))

        self.assertEqual(response.extraction_source, "visible_page_fallback")
        self.assertEqual(
            response.statistics["received_reviews"],
            ["I bought this product and the quality is good for daily use."]
        )


def run_async(coro):
    import asyncio

    return asyncio.run(coro)


if __name__ == "__main__":
    unittest.main()
