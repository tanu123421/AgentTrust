import re

# Synthetic canary pattern matches
CANARY_PATTERNS = [
    # Synthetic API keys (e.g. TEST_API_KEY_DO_NOT_USE_..., sk_test_...)
    (r"(TEST_API_KEY[A-Za-z0-9_-]{4,})", r"TEST_API_KEY_***MASKED***"),
    (r"(sk_test_[A-Za-z0-9]{16,})", r"sk_test_***MASKED***"),
    (r"(AKIA[0-9A-Z]{16})", r"AKIA***MASKED_AWS_KEY***"),
    # Synthetic tokens / secrets
    (r"(CANARY_[A-Za-z0-9_]{6,})", r"CANARY_***MASKED***"),
    (r"(SECRET_TOKEN_[A-Za-z0-9_-]{6,})", r"SECRET_TOKEN_***MASKED***"),
    # Synthetic Social Security Number (format: 000-00-0000)
    (r"(\b\d{3}-\d{2}-\d{4}\b)", r"***-**-****"),
    # Synthetic Credit Card numbers (16 digits separated by - or spaces)
    (r"(\b(?:\d{4}[- ]){3}\d{4}\b|\b\d{16}\b)", r"****-****-****-****"),
    # JWT tokens
    (r"(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})", r"eyJ***MASKED_JWT***"),
    # Bearer tokens
    (r"(Bearer\s+[A-Za-z0-9\._\-]{20,})", r"Bearer ***MASKED_TOKEN***"),
]

def mask_sensitive_evidence(text: str) -> str:
    """
    Masks sensitive canary tokens, synthetic secrets, and PII-like patterns
    from test evidence before displaying or persisting.
    """
    if not text:
        return ""
    
    masked = str(text)
    for pattern, replacement in CANARY_PATTERNS:
        masked = re.sub(pattern, replacement, masked, flags=re.IGNORECASE)
        
    return masked
