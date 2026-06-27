import pandas as pd
import re
from sklearn.model_selection import train_test_split

def clean_text(text):
    """
    Perform minimal preprocessing required for BERT.
    BERT's tokenizer handles most things, but we should remove excessive whitespace,
    HTML tags, and special characters if necessary.
    """
    if not isinstance(text, str):
        return ""
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    # Remove special characters and numbers (optional for BERT, but can help)
    # text = re.sub(r'[^a-zA-Z\s]', '', text) 
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess_dataset(input_csv, output_train, output_val, test_size=0.2):
    """
    Loads dataset, cleans text, and splits into train/validation sets.
    """
    print(f"Loading dataset from {input_csv}...")
    df = pd.read_csv(input_csv)
    
    # Cleaning the text
    print("Cleaning text...")
    df['text_'] = df['text_'].apply(clean_text)
    
    # Drop empty rows
    df = df.dropna(subset=['text_', 'label'])
    
    # Train/Validation split
    print(f"Splitting dataset (test_size={test_size})...")
    train_df, val_df = train_test_split(df, test_size=test_size, stratify=df['label'], random_state=42)
    
    # Save processed files
    train_df.to_csv(output_train, index=False)
    val_df.to_csv(output_val, index=False)
    
    print(f"Preprocessing complete. Train: {len(train_df)}, Val: {len(val_df)}")
    print(f"Saved to {output_train} and {output_val}")

if __name__ == "__main__":
    import os
    data_path = "ml/data/reviews.csv"
    if not os.path.exists(data_path):
        print(f"Warning: {data_path} not found. Please run generate_data.py first.")
    else:
        preprocess_dataset(
            data_path,
            "ml/data/train.csv",
            "ml/data/val.csv"
        )
