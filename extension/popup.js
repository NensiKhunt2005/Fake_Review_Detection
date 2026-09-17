// UI Elements
const scanBtn = document.getElementById('scan-btn');
const rescanBtn = document.getElementById('rescan-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const initialState = document.getElementById('initial-state');
const loadingState = document.getElementById('loading-state');
const resultsState = document.getElementById('results-state');

// Result fields
const trustScoreVal = document.getElementById('trust-score-val');
const genuinePct = document.getElementById('genuine-pct');
const suspiciousPct = document.getElementById('suspicious-pct');
const totalReviews = document.getElementById('total-reviews');
const riskList = document.getElementById('risk-list');
const productName = document.getElementById('product-name');
const productRating = document.getElementById('product-rating');
const siteName = document.getElementById('site-name');
const avgConfidence = document.getElementById('avg-confidence');
const recommendation = document.getElementById('recommendation');

let lastAnalysisResults = null;
const MIN_VISIBLE_REVIEWS_BEFORE_SCRAPER = 5;

function requestProductData(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: "get_product_reviews" }, async (response) => {
            if (!chrome.runtime.lastError) {
                resolve(response);
                return;
            }

            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ["content.js"]
                });

                chrome.tabs.sendMessage(tabId, { action: "get_product_reviews" }, (retryResponse) => {
                    resolve(chrome.runtime.lastError ? null : retryResponse);
                });
            } catch (error) {
                console.error("Content script injection failed:", error);
                resolve(null);
            }
        });
    });
}

async function analyzeActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    initialState.classList.add('hidden');
    resultsState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    const response = await requestProductData(tab.id);

    if (!response || !response.supported) {
            showInitialError("This extension currently supports Amazon and Flipkart product pages.");
            return;
    }

    const visibleReviews = response.reviews || [];
    const useDeepScraper = visibleReviews.length < MIN_VISIBLE_REVIEWS_BEFORE_SCRAPER;

    try {
        const apiRes = useDeepScraper
            ? await fetch('http://localhost:8000/analyze-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: response.sourceUrl,
                    visible_reviews: visibleReviews,
                    product_name: response.productName,
                    product_rating: response.productRating,
                    site: response.site,
                    max_pages: 1
                })
            })
            : await fetch('http://localhost:8000/trust-score', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      reviews: visibleReviews,
                      product_name: response.productName,
                      product_rating: response.productRating,
                      site: response.site,
                      source_url: response.sourceUrl
                  })
              });

        if (!apiRes.ok) {
            const errorData = await apiRes.json().catch(() => ({}));
            throw new Error(errorData.detail || "Backend API failure");
        }

        const data = await apiRes.json();
        lastAnalysisResults = {
                ...data,
                review_metadata: response.reviewMetadata || [],
                used_deep_scraper: useDeepScraper
            };
        updateUI(lastAnalysisResults);
    } catch (err) {
        console.error("API Error:", err);
        showInitialError(err.message || "Error connecting to backend server at http://localhost:8000. Please ensure the server is running.");
    }
}

function showInitialError(message) {
    loadingState.classList.add('hidden');
    initialState.classList.remove('hidden');
    initialState.innerHTML = `<p class="hint error">${message}</p>`;
}

scanBtn.addEventListener('click', analyzeActiveTab);
rescanBtn.addEventListener('click', analyzeActiveTab);

function updateUI(data) {
    loadingState.classList.add('hidden');
    resultsState.classList.remove('hidden');

    trustScoreVal.innerText = data.trust_score;
    genuinePct.innerText = `${data.genuine_percentage}%`;
    suspiciousPct.innerText = `${data.suspicious_percentage}%`;
    totalReviews.innerText = `${data.total_reviews} reviews`;
    avgConfidence.innerText = `${Math.round((data.average_confidence || 0) * 100)}%`;
    recommendation.innerText = data.overall_recommendation || "Review results carefully";
    productName.innerText = data.product_name || "Product";
    productRating.innerText = data.product_rating ? `${data.product_rating}/5 public rating` : "Rating unavailable";
    siteName.innerText = data.site || "Product page";

    // Clear and update risks
    riskList.innerHTML = "";
    if (data.risk_indicators && data.risk_indicators.length > 0) {
        data.risk_indicators.forEach(risk => {
            const li = document.createElement('li');
            li.innerText = risk;
            riskList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerText = "No significant risks detected";
        riskList.appendChild(li);
    }

    // Update score circle color based on score
    const circle = document.querySelector('.score-circle');
    if (data.trust_score >= 7) {
        circle.style.borderColor = "#10b981";
    } else if (data.trust_score >= 4) {
        circle.style.borderColor = "#f59e0b";
    } else {
        circle.style.borderColor = "#ef4444";
    }
}

dashboardBtn.addEventListener('click', () => {
    if (lastAnalysisResults) {
        const dataStr = JSON.stringify(lastAnalysisResults);
        const encodedData = btoa(unescape(encodeURIComponent(dataStr)));

        chrome.tabs.create({
            url: `http://localhost:3000/dashboard#data=${encodedData}`
        });
    }
});
