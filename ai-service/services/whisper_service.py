import os
import logging

logger = logging.getLogger(__name__)

# Speech-to-text is routed directly to the Google Gemini API in the cloud.
WHISPER_AVAILABLE = False

class WhisperService:
    def __init__(self):
        self.model = None
        logger.info("Local Whisper is disabled. AI service will use Google Gemini API for cloud transcription.")

    def transcribe(self, audio_path: str, gemini_fallback_fn=None) -> str:
        """
        Transcribes the audio file directly using the Google Gemini API.
        """
        if gemini_fallback_fn:
            logger.info(f"Transcribing via Gemini API: {audio_path}")
            return gemini_fallback_fn(audio_path)
        else:
            raise RuntimeError("No transcription service available (Gemini API fallback function is missing).")
