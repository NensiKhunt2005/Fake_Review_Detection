import pandas as pd
import numpy as np
import os

def generate_mock_data(output_path, num_samples=1000):
    """
    Generates a mock dataset for fake review detection if no real dataset is provided.
    Labels: 0 = Genuine, 1 = Fake
    """
    reviews = []
    labels = []
    
    genuine_reviews = [
        "This product is amazing! I use it every day and it works perfectly.",
        "Good quality for the price. I would recommend this to a friend.",
        "The shipping was fast and the item arrived in perfect condition.",
        "I've been using this for a month and it's been great. No issues at all.",
        "Exactly as described. Very happy with my purchase."
    ]
    
    fake_reviews = [
        "BEST PRODUCT EVER!!! BUY NOW!!!",
        "I love this product so much, it changed my life. 10/10.",
        "This is a scam, but I'm writing a fake positive review for money.",
        "Super fast shipping, great seller, awesome product!",
        "Definitely worth it, buy it immediately. Greatest purchase ever."
    ]
    
    for _ in range(num_samples):
        if np.random.rand() > 0.5:
            reviews.append(np.random.choice(genuine_reviews))
            labels.append(0)
        else:
            reviews.append(np.random.choice(fake_reviews))
            labels.append(1)
            
    df = pd.DataFrame({
        'text_': reviews,
        'label': labels
    })
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Mock dataset generated at {output_path}")

if __name__ == "__main__":
    generate_mock_data("ml/data/reviews.csv")
