import torch
import numpy as np
from lime.lime_text import LimeTextExplainer
import torch.nn.functional as F

class Explainer:
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.explainer = LimeTextExplainer(class_names=['Genuine', 'Fake'])
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def predictor(self, texts):
        inputs = self.tokenizer(texts, return_tensors="pt", truncation=True, padding=True, max_length=128)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = F.softmax(outputs.logits, dim=1)
            
        return probs.cpu().numpy()

    def explain(self, text):
        # Reduced samples for significant speed improvement (100 -> 50)
        num_samples = 50 
        exp = self.explainer.explain_instance(text, self.predictor, num_features=10, num_samples=num_samples)
        return dict(exp.as_list())

# Global explainer instance to be initialized lazily
_explainer_instance = None

def get_explanation(text, model, tokenizer):
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = Explainer(model, tokenizer)
    return _explainer_instance.explain(text)

