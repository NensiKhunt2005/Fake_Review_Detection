import torch
from transformers import AutoTokenizer, BertForSequenceClassification
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

def evaluate_model(model_path, tokenizer_path, test_data_path):
    print(f"Loading model from {model_path}...")
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
    model = BertForSequenceClassification.from_pretrained(model_path)
    model.eval()

    df = pd.read_csv(test_data_path)
    reviews = df.text_.tolist()
    labels = df.label.tolist()

    preds = []
    
    print("Running evaluation...")
    with torch.no_grad():
        for review in reviews:
            inputs = tokenizer(review, return_tensors="pt", truncation=True, padding=True, max_length=128)
            outputs = model(**inputs)
            prediction = torch.argmax(outputs.logits, dim=1).item()
            preds.append(prediction)

    print("\nClassification Report:")
    print(classification_report(labels, preds))
    
    print("Confusion Matrix:")
    print(confusion_matrix(labels, preds))

if __name__ == "__main__":
    evaluate_model(
        "backend/model/bert_model",
        "backend/model/tokenizer",
        "ml/data/val.csv"
    )
