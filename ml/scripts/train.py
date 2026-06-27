import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import os

# Configuration
MODEL_NAME = 'bert-base-uncased'
TRAIN_DATA = 'ml/data/train.csv'
VAL_DATA = 'ml/data/val.csv'
MODEL_OUT = 'backend/model/bert_model'
TOKENIZER_OUT = 'backend/model/tokenizer'
BATCH_SIZE = 8
EPOCHS = 1
MAX_LEN = 128

class ReviewDataset(Dataset):
    def __init__(self, reviews, labels, tokenizer, max_len):
        self.reviews = reviews
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.reviews)

    def __getitem__(self, item):
        review = str(self.reviews[item])
        label = self.labels[item]

        encoding = self.tokenizer(
            review,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
        )

        return {
            'review_text': review,
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='binary')
    acc = accuracy_score(labels, preds)
    return {
        'accuracy': acc,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

def train():
    # Load data
    train_df = pd.read_csv(TRAIN_DATA)
    val_df = pd.read_csv(VAL_DATA)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    train_dataset = ReviewDataset(
        reviews=train_df.text_.to_numpy(),
        labels=train_df.label.to_numpy(),
        tokenizer=tokenizer,
        max_len=MAX_LEN
    )

    val_dataset = ReviewDataset(
        reviews=val_df.text_.to_numpy(),
        labels=val_df.label.to_numpy(),
        tokenizer=tokenizer,
        max_len=MAX_LEN
    )

    model = BertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs',
        report_to="none",
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    print("Starting training...")
    trainer.train()

    print("Evaluating...")
    print(trainer.evaluate())

    # Save model and tokenizer
    print(f"Saving model to {MODEL_OUT} and tokenizer to {TOKENIZER_OUT}...")
    model.save_pretrained(MODEL_OUT)
    tokenizer.save_pretrained(TOKENIZER_OUT)
    print("Done!")

if __name__ == "__main__":
    train()
