import json
import urllib.error
import urllib.request

from .config import settings
from .review_filter import filter_review_texts


class ScraperClientError(Exception):
    pass


def scrape_reviews_from_url(url, max_pages=1):
    payload = {
        "url": url,
        "max_pages": max_pages,
        "drop_emojis": True,
        "remove_duplicates": True,
    }
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        settings.scraper_api_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=settings.scraper_timeout_seconds
        ) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ScraperClientError(f"Scraper API returned HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise ScraperClientError(f"Scraper API is unavailable: {exc.reason}") from exc
    except TimeoutError as exc:
        raise ScraperClientError("Scraper API timed out") from exc
    except json.JSONDecodeError as exc:
        raise ScraperClientError("Scraper API returned invalid JSON") from exc

    reviews = data.get("reviews") or []
    if not isinstance(reviews, list):
        raise ScraperClientError("Scraper API returned an invalid reviews payload")

    return {
        "website": data.get("website", "ReviewScrapingAPI"),
        "reviews": filter_review_texts(reviews, limit=settings.max_reviews),
        "total_reviews": data.get("total_reviews", len(reviews)),
    }
