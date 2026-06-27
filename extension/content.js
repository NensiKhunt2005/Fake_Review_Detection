function extractReviews() {
    console.log("Fake Review Detector: Starting refined extraction...");
    const reviews = [];

    // 1. Strict selectors for major sites (Most reliable)
    const strictSelectors = [
        '[data-hook="review-body"]',        // Amazon
        '.t-ZTKy',                          // Flipkart (Review text)
        '.review-text-content',             // Amazon Alternative
        '.Z_3JlZ',                          // Flipkart Alternative
        '.c-review-card__text',             // Walmart
        '.review-content',                  // Generic
        '.review-body'                      // Common
    ];

    // 2. Blacklist of selectors for navigation, promo, and UI elements
    const blacklistSelectors = [
        '#nav-belt', '#nav-main',           // Amazon Nav
        '#wayfinding-breadcrumbs_container', // Amazon Breadcrumbs
        '#breadcrumb-container',            // Generic Breadcrumbs
        '.a-carousel-container',            // Amazon Carousels
        '.premium-banner',                  // Promotional banners
        '.nav-links', '.footer',            // General Nav/Footer
        '#dp-ads-center-promo_top_Placement', // Amazon Ads
        '.sponsored-products-atc',           // Sponsored items
        '.p13n-desktop-grid',               // Recommendations
        '.similar-products-container',       // Similar items
        '.vi-ppc-main-container',            // eBay PPC
        '#reviews-medley-footer',           // Amazon see all reviews link area
        '#priceblock_ourprice', '#price_inside_buybox', // Price areas
        '.a-price', '.apexPriceToPay'       // Price classes
    ];

    // Remove blacklist items from the DOM search or skip them during scanning
    function isBlacklisted(el) {
        if (!el) return false;
        // Check if the element or any of its parents match blacklist
        if (blacklistSelectors.some(sel => el.closest(sel))) return true;

        // Also check for hidden elements
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true;

        return false;
    }

    // 3. Strategy A: Try strict selectors first
    strictSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (isBlacklisted(el)) return;
            const text = el.innerText.trim();

            // CRITICAL: Filter out text that contains common noise characters but isn't a long sentence
            if (text.includes('>') || text.includes('₹') || text.includes('$') || text.includes('€')) {
                if (text.split(' ').length < 15) return;
            }

            // A good review is usually at least 20 characters and not just numbers/symbols
            if (text.length > 20 && /[a-zA-Z]/.test(text)) {
                if (text.split(' ').length >= 5) {
                    reviews.push(text.replace(/\s+/g, ' ').trim());
                }
            }
        });
    });

    // 4. Strategy B: If too few reviews found, try heuristics but with EXTREMELY strict filters
    if (reviews.length < 3) {
        const potentialElements = document.querySelectorAll('p, span, div, blockquote');
        potentialElements.forEach(el => {
            if (isBlacklisted(el)) return;

            const text = el.innerText.trim();
            // Breadcrumbs and UI text are usually short. Reviews are longer.
            if (text.length > 60 && text.length < 5000 && text.split(' ').length > 12) {
                // Symbols like > | / often indicate navigation or paths
                if (/[>|/\\$₹€]/.test(text)) return;

                const isReviewLike = /verified purchase|reviewed in|bought this|i recommend|quality is|product is/i.test(text);
                const hasReviewParent = /review|comment|feedback/i.test(el.parentElement?.className || '') ||
                    /review|comment|feedback/i.test(el.parentElement?.id || '');

                if (isReviewLike || hasReviewParent) {
                    let cleanText = text.replace(/\s+/g, ' ').trim();
                    if (!reviews.some(r => r.includes(cleanText) || cleanText.includes(r))) {
                        reviews.push(cleanText);
                    }
                }
            }
        });
    }

    // Final deduplication and quality check
    let uniqueReviews = Array.from(new Set(reviews))
        .filter(r => !/login|sign in|privacy policy|terms of service|copyright|rights reserved/i.test(r)) // Filter out legal text
        .filter(r => r.split(' ').length >= 5); // Ensure it's a sentence

    console.log(`Fake Review Detector: Found ${uniqueReviews.length} unique reviews`);
    return uniqueReviews.slice(0, 50); // Limit to 50 for performance
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_reviews") {
        sendResponse({ reviews: extractReviews() });
    }
});
