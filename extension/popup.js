// UI Elements
const scanBtn = document.getElementById('scan-btn');
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

let lastAnalysisResults = null;

scanBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Switch to loading state
    initialState.classList.add('hidden');
    resultsState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    chrome.tabs.sendMessage(tab.id, { action: "get_reviews" }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.reviews || response.reviews.length === 0) {
            loadingState.classList.add('hidden');
            initialState.classList.remove('hidden');
            initialState.innerHTML = `<p class="hint error">Could not find reviews on this page. Make sure you are on a product page and reviews are visible.</p>`;
            return;
        }

        try {
            const apiRes = await fetch('http://localhost:8000/api/trust-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviews: response.reviews })
            });

            if (!apiRes.ok) throw new Error("Backend API failure");

            const data = await apiRes.json();
            lastAnalysisResults = data;
            updateUI(data);
        } catch (err) {
            console.error("API Error:", err);
            loadingState.classList.add('hidden');
            initialState.classList.remove('hidden');
            initialState.innerHTML = `<p class="hint error">Error connecting to backend server at http://localhost:8000. Please ensure the server is running.</p>`;
        }
    });
});

function updateUI(data) {
    loadingState.classList.add('hidden');
    resultsState.classList.remove('hidden');

    trustScoreVal.innerText = data.trust_score;
    genuinePct.innerText = `${data.genuine_percentage}%`;
    suspiciousPct.innerText = `${data.suspicious_percentage}%`;
    totalReviews.innerText = `${data.total_reviews} reviews`;

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
        // Encode results as a base64 string to safely pass via URL
        const dataStr = JSON.stringify(lastAnalysisResults);
        const encodedData = btoa(unescape(encodeURIComponent(dataStr)));

        // Open the dashboard with data in the URL hash
        chrome.tabs.create({
            url: `http://localhost:3000/dashboard#data=${encodedData}`
        });
    }
});
