const SITE_CONFIGS = [
    {
        id: "amazon",
        name: "Amazon",
        hostPattern: /(^|\.)amazon\./i,
        productSelectors: ["#productTitle", "#title", "h1"],
        ratingSelectors: ["#acrPopover .a-icon-alt", "span[data-hook='rating-out-of-text']", ".reviewCountTextLinkedHistogram .a-icon-alt"],
        reviewSelectors: [
            "[data-hook='review']",
            "[id^='customer_review-']"
        ],
        reviewTextSelectors: ["[data-hook='review-body']", ".review-text-content", ".reviewText"],
        reviewRatingSelectors: [".review-rating .a-icon-alt", "[data-hook='review-star-rating'] .a-icon-alt"],
        reviewDateSelectors: ["[data-hook='review-date']", ".review-date"]
    },
    {
        id: "flipkart",
        name: "Flipkart",
        hostPattern: /(^|\.)flipkart\.com$/i,
        productSelectors: [".VU-ZEz", "span.B_NuCI", "h1 span", "h1"],
        ratingSelectors: [".XQDdHH", "._3LWZlK", "._2d4LTz"],
        reviewSelectors: [
            "._27M-vq",
            "._16PBlm"
        ],
        reviewTextSelectors: [".ZmyHeo", ".t-ZTKy", "._11pzQk"],
        reviewRatingSelectors: [".XQDdHH", "._3LWZlK"],
        reviewDateSelectors: ["._2NsDsF", ".row div:last-child"]
    }
];

function activeSite() {
    return SITE_CONFIGS.find((site) => site.hostPattern.test(window.location.hostname));
}

function firstText(selectors, root = document) {
    for (const selector of selectors) {
        const element = root.querySelector(selector);
        const text = element?.innerText?.trim();
        if (text) return text.replace(/\s+/g, " ");
    }
    return "";
}

function parseRating(text) {
    if (!text) return null;
    const match = text.replace(",", ".").match(/([0-5](?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
}

function cleanReviewText(text) {
    return (text || "")
        .replace(/\s+/g, " ")
        .replace(/^read more\s*/i, "")
        .trim();
}

function isReviewLikeText(text) {
    const cleaned = cleanReviewText(text);
    const words = cleaned.match(/[a-zA-Z]+/g) || [];
    const blocked = /add to cart|buy now|sponsored|prime|delivery|update location|customer service|privacy policy|terms of service|copyright|sign in|login|search amazon|webpage at|moved permanently|customers say|ai generated from the text of customer reviews|top reviews from|select to learn more/i;
    const signal = /\bi\b|\bmy\b|\bwe\b|used|using|bought|purchased|ordered|received|quality|product|item|worth|recommend|experience|works?|broke|damaged|excellent|perfect|poor|good|bad/i;

    if (cleaned.length < 20 || cleaned.length > 3000) return false;
    if (words.length < 5) return false;
    if (/[₹$€]/.test(cleaned)) return false;
    if (blocked.test(cleaned)) return false;
    if ((cleaned.match(/[>|]/g) || []).length >= 2) return false;
    // A single review body never contains several independent review cards.
    // These labels appear when a page-level or list-level container was selected.
    const reviewCardMarkers = cleaned.match(/reviewed in .*? on|verified purchase|certified buyer|helpful report|\b[1-5](?:\.0)? out of 5 stars\b/gi) || [];
    if (reviewCardMarkers.length >= 2) return false;
    if (!signal.test(cleaned) && words.length < 12) return false;

    return true;
}

function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function reviewTextFromCard(card, selectors) {
    for (const selector of selectors) {
        const element = card.querySelector(selector);
        const text = cleanReviewText(element?.innerText);
        if (text && isReviewLikeText(text)) return text;
    }
    return "";
}

function extractReviewCards(site) {
    const items = [];
    for (const selector of site.reviewSelectors) {
        document.querySelectorAll(selector).forEach((card) => {
            if (!isVisible(card)) return;
            const text = reviewTextFromCard(card, site.reviewTextSelectors);
            if (!isReviewLikeText(text)) return;
            items.push({
                text,
                rating: parseRating(firstText(site.reviewRatingSelectors, card)),
                date: firstText(site.reviewDateSelectors, card) || null
            });
        });
        if (items.length >= 3) break;
    }
    return items;
}

function dedupeReviews(items) {
    const seen = new Set();
    const unique = [];
    for (const item of items) {
        const key = item.text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
    }
    return unique.slice(0, 50);
}

function extractProductData() {
    const site = activeSite();
    if (!site) {
        return {
            supported: false,
            site: "Unsupported",
            productName: "Unsupported page",
            productRating: null,
            sourceUrl: window.location.href,
            reviews: [],
            reviewMetadata: []
        };
    }

    // Do not use a generic DOM fallback here. On commerce pages it can select a
    // page section containing summaries, controls, and many review cards as one
    // "review". Returning no visible reviews is safe: the dedicated scraper can
    // then be used, whereas a merged page section corrupts the classifier input.
    const reviews = dedupeReviews(extractReviewCards(site));

    return {
        supported: true,
        site: site.name,
        productName: firstText(site.productSelectors) || document.title.replace(/\s*[-|].*$/, "").trim() || "Product",
        productRating: parseRating(firstText(site.ratingSelectors)),
        sourceUrl: window.location.href,
        reviews: reviews.map((review) => review.text),
        reviewMetadata: reviews.map((review) => ({
            rating: review.rating,
            date: review.date
        }))
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_product_reviews") {
        sendResponse(extractProductData());
    }
});
