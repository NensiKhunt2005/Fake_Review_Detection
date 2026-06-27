import requests
import time

def test_performance():
    url = "http://localhost:8000/api/trust-score"
    # 50 mock reviews to test batch processing
    reviews = [
        "This product is amazing, definitely worth the money!",
        "Poor quality, broke after two days of use. Avoid.",
        "Great value for price, shipping was fast too.",
        "The item arrived damaged. Very disappointed with the seller.",
        "Satisfied with the purchase, works as described."
    ] * 10
    
    start_time = time.time()
    try:
        response = requests.post(url, json={"reviews": reviews})
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Processed {data['total_reviews']} reviews in {end_time - start_time:.2f} seconds.")
            print(f"Trust Score: {data['trust_score']}")
            explained = sum(1 for res in data['results'] if res['explanation'] is not None)
            print(f"Reviews with explanations: {explained} (Expected max 5)")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}. Make sure the backend server is running on port 8000.")

if __name__ == "__main__":
    test_performance()
