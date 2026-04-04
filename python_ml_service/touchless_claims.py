import cv2
import numpy as np
from transformers import pipeline

# Mock NLP processing model initialization
# Using a sentiment/classification pipeline to simulate assessing a rider's note for urgency/validity
try:
    nlp_classifier = pipeline("text-classification", model="distilbert-base-uncased", top_k=None)
except Exception as e:
    nlp_classifier = None
    print(f"Warning: Could not load NLP model: {e}")

def assess_damage_cv(image_path: str) -> float:
    """
    Simulates Computer Vision damage assessment.
    In a real scenario, this would use a robust CNN (TensorFlow/PyTorch)
    to classify damage severity. Here we use an edge-detection heuristic as a proxy.
    Returns a confidence score 0.0 - 1.0.
    """
    if not image_path or image_path == "dummy_path":
        # Simulate high confidence for demo purposes
        return 0.88
        
    try:
        img = cv2.imread(image_path)
        if img is None: return 0.0
        
        # Convert to grayscale and apply Canny edge detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        
        # Proxy: More edges = more "damage" or complexity in the photo
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        # Normalize to a mock confidence score between 0.5 and 0.99
        confidence = min(0.5 + (edge_density * 5), 0.99)
        return confidence
    except Exception as e:
        print(f"CV Error: {e}")
        return 0.0

def process_touchless_claim(rider_note: str, image_path: str = None) -> dict:
    """
    Processes a touchless claim in < 1 min automatically.
    Combines CV image assessment and NLP text assessment to generate a final confidence.
    """
    # 1. Computer Vision Assessment
    cv_confidence = assess_damage_cv(image_path)
    
    # 2. NLP Assessment of Rider Note
    nlp_confidence = 0.5
    if nlp_classifier and rider_note:
        try:
            results = nlp_classifier(rider_note)
            # Find the score of the top label generically
            nlp_confidence = results[0][0]['score'] if results and len(results) > 0 else 0.5
        except Exception:
            pass
    elif rider_note and len(rider_note) > 10:
        # Mock simple fallback
        nlp_confidence = 0.8
        
    # 3. Decision Engine
    # Fusion of scores (weighted 70% visual, 30% text)
    final_confidence = (cv_confidence * 0.7) + (nlp_confidence * 0.3)
    
    decision = "MANUAL_REVIEW"
    if final_confidence >= 0.85:
        decision = "INSTANT_APPROVAL"
    elif final_confidence <= 0.4:
        decision = "REJECTED_LOW_CONFIDENCE"
        
    return {
        "final_confidence": round(final_confidence, 4),
        "cv_confidence": round(cv_confidence, 4),
        "nlp_confidence": round(nlp_confidence, 4),
        "decision": decision,
        "processing_time_ms": 350 # Simulated fast edge-friendly compute
    }

if __name__ == "__main__":
    # Test script locally
    res = process_touchless_claim("Severe water logging caused engine failure and accident.", "dummy_path")
    print("Touchless Claim Result:", res)
