# Download models from cloud storage
import os
import requests

def download_file(url, filename):
    if not os.path.exists(filename):
        print(f"Downloading {filename}...")
        response = requests.get(url)
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"{filename} downloaded successfully")

def ensure_models():
    # Replace with your actual cloud storage URLs
    model_urls = {
        'disaster_classifier_pipeline.pkl': 'YOUR_CLOUD_URL_1',
        'category_names.pkl': 'YOUR_CLOUD_URL_2', 
        'label_thresholds.pkl': 'YOUR_CLOUD_URL_3'
    }
    
    for filename, url in model_urls.items():
        if url != 'YOUR_CLOUD_URL_1':  # Only download if real URLs provided
            download_file(url, filename)