import re


BLOCKED_PATTERNS = [
    r"\badd to cart\b",
    r"\bbuy now\b",
    r"\bsponsored\b",
    r"\bprime\b",
    r"\bdelivery\b",
    r"\bupdate location\b",
    r"\bcustomer service\b",
    r"\bprivacy policy\b",
    r"\bterms of service\b",
    r"\bcopyright\b",
    r"\bsign in\b",
    r"\blogin\b",
    r"\bsearch amazon\b",
    r"\bthis page could not be found\b",
    r"\bwebpage at\b.*\bmight be temporarily down\b",
    r"\bmoved permanently to a new web address\b",
    r"\bcustomers say\b",
    r"\bai generated from the text of customer reviews\b",
    r"\btop reviews from\b",
    r"\bselect to learn more\b",
]

# These are review-card labels, not review prose. One label may accompany an
# otherwise valid card, but several occurrences mean a whole review list or
# page container was submitted as one item.
REVIEW_CARD_MARKER = re.compile(
    r"reviewed in .*? on|verified purchase|certified buyer|helpful report|"
    r"\b[1-5](?:\.0)? out of 5 stars\b",
    re.IGNORECASE,
)

REVIEW_SIGNALS = [
    r"\bi\b",
    r"\bmy\b",
    r"\bwe\b",
    r"\bused\b",
    r"\busing\b",
    r"\bbought\b",
    r"\bpurchased\b",
    r"\bordered\b",
    r"\breceived\b",
    r"\bquality\b",
    r"\bproduct\b",
    r"\bitem\b",
    r"\bworth\b",
    r"\brecommend\b",
    r"\bexperience\b",
    r"\bworks?\b",
    r"\bbroke\b",
    r"\bdamaged\b",
    r"\bexcellent\b",
    r"\bperfect\b",
    r"\bpoor\b",
    r"\bgood\b",
    r"\bbad\b",
]


def normalize_review_text(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def is_review_text(text):
    cleaned = normalize_review_text(text)
    lowered = cleaned.lower()
    words = re.findall(r"[a-zA-Z]+", cleaned)

    if len(cleaned) < 20 or len(cleaned) > 3000:
        return False
    if len(words) < 5:
        return False
    if re.search(r"[₹$€]", cleaned):
        return False
    if any(re.search(pattern, lowered) for pattern in BLOCKED_PATTERNS):
        return False
    if lowered.count("|") >= 2 or lowered.count(">") >= 2:
        return False
    if len(REVIEW_CARD_MARKER.findall(cleaned)) >= 2:
        return False

    signal_count = sum(1 for pattern in REVIEW_SIGNALS if re.search(pattern, lowered))
    if signal_count == 0 and len(words) < 12:
        return False

    return True


def filter_review_texts(reviews, limit=None):
    filtered = []
    seen = set()
    for review in reviews:
        cleaned = normalize_review_text(review)
        key = cleaned.lower()
        if key in seen:
            continue
        if not is_review_text(cleaned):
            continue
        seen.add(key)
        filtered.append(cleaned)
        if limit and len(filtered) >= limit:
            break
    return filtered
