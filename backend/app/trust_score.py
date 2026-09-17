from collections import Counter
from statistics import mean
import re


def normalize_review(text):
    return re.sub(r"\s+", " ", text.strip().lower())


def duplicate_percentage(reviews):
    normalized = [normalize_review(review) for review in reviews if review.strip()]
    if not normalized:
        return 0
    counts = Counter(normalized)
    duplicate_count = sum(count - 1 for count in counts.values() if count > 1)
    return round((duplicate_count / len(normalized)) * 100, 1)


def build_reasons(prediction, confidence, explanation=None):
    reasons = []
    if prediction == "Fake":
        reasons.append("The model found language patterns associated with suspicious reviews.")
        if confidence >= 0.85:
            reasons.append("The suspicious classification has high model confidence.")
    else:
        reasons.append("The review language is closer to patterns seen in genuine reviews.")
        if confidence < 0.65:
            reasons.append("The model confidence is moderate, so this result should be reviewed with context.")

    if explanation:
        top_terms = [word for word, score in sorted(explanation.items(), key=lambda item: abs(item[1]), reverse=True)[:3]]
        if top_terms:
            reasons.append("Key influencing terms: " + ", ".join(top_terms))
    return reasons


def highlighted_words(explanation=None):
    if not explanation:
        return []
    return [
        word
        for word, _score in sorted(explanation.items(), key=lambda item: abs(item[1]), reverse=True)[:8]
    ]


def calculate_trust_score(predictions, reviews, product_rating=None):
    total = len(predictions)
    if total == 0:
        return {
            "trust_score": 0,
            "genuine_percentage": 0,
            "suspicious_percentage": 0,
            "average_confidence": 0,
            "duplicate_percentage": 0,
            "overall_recommendation": "Not enough review data",
            "risk_indicators": ["No valid reviews were available for analysis"],
            "statistics": {},
        }

    fake_items = [item for item in predictions if item["prediction"] == "Fake"]
    genuine_items = [item for item in predictions if item["prediction"] == "Genuine"]
    suspicious_percentage = (len(fake_items) / total) * 100
    genuine_percentage = (len(genuine_items) / total) * 100
    average_confidence = mean(item["confidence"] for item in predictions)
    high_confidence_fake = [
        item for item in fake_items if item["confidence"] >= 0.85
    ]
    duplicate_rate = duplicate_percentage(reviews)

    score = 10
    score -= suspicious_percentage / 12
    score -= len(high_confidence_fake) / total * 2
    score -= duplicate_rate / 25

    if average_confidence < 0.65:
        score -= 0.8
    if product_rating is not None and product_rating >= 4.5 and suspicious_percentage > 35:
        score -= 0.7

    trust_score = max(0, min(10, round(score, 1)))
    risk_indicators = []

    if suspicious_percentage >= 50:
        risk_indicators.append("More than half of the analyzed reviews look suspicious")
    elif suspicious_percentage >= 25:
        risk_indicators.append("Elevated suspicious review ratio")
    if high_confidence_fake:
        risk_indicators.append("High-confidence suspicious reviews detected")
    if duplicate_rate >= 15:
        risk_indicators.append("Repeated or duplicate review text patterns detected")
    if total < 5:
        risk_indicators.append("Low review count limits confidence in the product-level score")
    if average_confidence < 0.65:
        risk_indicators.append("Average model confidence is moderate")
    if product_rating is not None and product_rating >= 4.5 and suspicious_percentage > 35:
        risk_indicators.append("High public rating conflicts with suspicious review signals")
    if not risk_indicators:
        risk_indicators.append("No major risk indicators detected")

    if trust_score >= 7.5:
        recommendation = "Reviews look broadly trustworthy"
    elif trust_score >= 5:
        recommendation = "Use caution and inspect suspicious reviews"
    else:
        recommendation = "High risk: verify with external sources before trusting reviews"

    return {
        "trust_score": trust_score,
        "genuine_percentage": round(genuine_percentage, 1),
        "suspicious_percentage": round(suspicious_percentage, 1),
        "average_confidence": round(average_confidence, 3),
        "duplicate_percentage": duplicate_rate,
        "overall_recommendation": recommendation,
        "risk_indicators": risk_indicators,
        "statistics": {
            "genuine_count": len(genuine_items),
            "suspicious_count": len(fake_items),
            "high_confidence_suspicious_count": len(high_confidence_fake),
            "low_confidence_count": len([item for item in predictions if item["confidence"] < 0.65]),
        },
    }
