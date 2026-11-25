"""Single source of truth for text normalisation (mirrored in lib/engine/normalize.ts; parity tested)."""
import re
import unicodedata

URL_RE = re.compile(
    r"(https?://\S+|www\.\S+|(?<![a-z0-9-])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|top|xyz|live|icu|cc|online|site|co|me|ly|gy|net|org|app|link|click|info)(?:/\S*)?)"
)
PHONE_RE = re.compile(r"(?:\+?91[\s-]?)?[6-9][0-9]{4}[\s-]?[0-9]{5}")
DIGITS_RE = re.compile(r"[0-9]+")
WS_RE = re.compile(r"\s+")


def norm(text: str) -> str:
    t = unicodedata.normalize("NFKC", text).lower()
    t = URL_RE.sub(" urltok ", t)
    t = PHONE_RE.sub(" phonetok ", t)
    t = DIGITS_RE.sub("0", t)
    return WS_RE.sub(" ", t).strip()


