from transformers import AutoTokenizer, BertForSequenceClassification
import torch
import os
from .config import settings

class ModelLoader:
    def __init__(self, model_path, tokenizer_path):
        self.model_path = model_path
        self.tokenizer_path = tokenizer_path
        self.tokenizer = None
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def load_model(self):
        print(f"Loading model from {self.model_path}...")
        if not os.path.exists(self.model_path) or not os.path.exists(self.tokenizer_path):
            raise FileNotFoundError("Model or Tokenizer files not found. Ensure training is complete.")
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_path)
        self.model = BertForSequenceClassification.from_pretrained(self.model_path)
        self.model.to(self.device)
        self.model.eval()
        print("Model loaded successfully.")

    def predict(self, text):
        if self.model is None or self.tokenizer is None:
            self.load_model()
            
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            confidence, prediction = torch.max(probs, dim=1)
            
        return {
            "prediction": "Fake" if prediction.item() == 1 else "Genuine",
            "confidence": float(confidence.item()),
            "probability": float(probs[0][prediction.item()].item()),
            "label_id": int(prediction.item())
        }

# Singleton instance
loader = ModelLoader(
    model_path=settings.model_path,
    tokenizer_path=settings.tokenizer_path
)
