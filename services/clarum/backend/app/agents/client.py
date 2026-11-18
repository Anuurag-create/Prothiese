"""Gemini client factory with a clear local-configuration error."""

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_API_VERSION


def get_genai_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Copy backend/.env.example to backend/.env, "
            "add your Google Gemini API key, and restart the backend."
        )
    # Structured JSON output (response_mime_type/response_schema) is served
    # on v1beta for the Gemini Developer API. The SDK v3 default changed to v1,
    # so set the API version explicitly instead of relying on SDK defaults.
    return genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(api_version=GEMINI_API_VERSION),
    )
