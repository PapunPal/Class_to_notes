import numpy as np
import logging

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("sentence-transformers is not installed. Using Gemini Embeddings or local TF-IDF vector matching.")
    SENTENCE_TRANSFORMERS_AVAILABLE = False

class EmbeddingService:
    def __init__(self):
        self.model = None

    def get_embedding(self, text: str, gemini_api_key: str = None) -> list:
        """
        Generates embedding vector (list of floats) for a text.
        """
        if not text:
            return [0.0] * 384 # Default dimension
            
        # 1. Try Gemini Embeddings API first (highly efficient for server memory/resources)
        if gemini_api_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_api_key)
                result = client.models.embed_content(
                    model="text-embedding-004",
                    contents=text
                )
                return result.embeddings[0].values
            except Exception as e:
                logger.error(f"Gemini Embedding failed: {e}")

        # 2. Fallback to local SentenceTransformer (only load lazily if needed)
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            if not self.model:
                try:
                    logger.info("Lazy-loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
                    self.model = SentenceTransformer('all-MiniLM-L6-v2')
                    logger.info("SentenceTransformer loaded.")
                except Exception as e:
                    logger.error(f"Failed to load SentenceTransformer: {e}")
                    self.model = None
            if self.model:
                try:
                    emb = self.model.encode(text, convert_to_numpy=True)
                    return emb.tolist()
                except Exception as e:
                    logger.error(f"Local SentenceTransformer embedding failed: {e}")

        # Fallback 2: Simple hashing/TF-IDF mock vector
        logger.warning("No embedding model available. Returning mock vector.")
        hash_val = sum(ord(c) for c in text) % 384
        vec = [0.0] * 384
        vec[hash_val] = 1.0
        return vec

    def compute_similarity(self, vec1: list, vec2: list) -> float:
        """
        Computes cosine similarity between two vectors.
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def semantic_search(self, query: str, items: list, text_field: str = "text", gemini_api_key: str = None) -> list:
        """
        Searches items semantically.
        items: list of dicts, e.g., [{'lecture_id': 1, 'text': '...'}]
        Returns the list of items sorted by cosine similarity score descending.
        """
        if not items:
            return []
            
        try:
            query_vector = self.get_embedding(query, gemini_api_key)
            scored_items = []
            
            for item in items:
                text_content = item.get(text_field, "")
                # Check if item already has a cached embedding vector
                item_vector = item.get("embedding")
                if not item_vector:
                    item_vector = self.get_embedding(text_content, gemini_api_key)
                
                score = self.compute_similarity(query_vector, item_vector)
                scored_items.append({
                    "item": item,
                    "score": score
                })
                
            # Sort by score descending
            scored_items.sort(key=lambda x: x["score"], reverse=True)
            return [si["item"] for si in scored_items]
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return items # Return unsorted in case of error
