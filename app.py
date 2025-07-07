from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import json
from datetime import datetime

app = Flask(__name__)

# Load model resources
try:
    with open("disaster_classifier_pipeline.pkl", "rb") as f:
        model = joblib.load(f)
    with open("label_thresholds.pkl", "rb") as f:
        thresholds = joblib.load(f)
    with open("category_names.pkl", "rb") as f:
        category_names = joblib.load(f)
    
    if isinstance(thresholds, (list, np.ndarray)):
        thresholds = {category: float(thresholds[i]) for i, category in enumerate(category_names)}
    
    model_loaded = True
except Exception as e:
    print(f"Error loading model: {e}")
    model_loaded = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify_message():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        message = data.get('message', '')
        threshold = data.get('threshold', 0.5)
        
        if not message.strip():
            return jsonify({'error': 'Empty message'}), 400
        
        # Predict probabilities
        y_pred_proba_list = model.predict_proba([message])
        
        predictions = {}
        for category, prob_array in zip(category_names, y_pred_proba_list):
            prob_val = float(prob_array[0][1])
            category_threshold = thresholds.get(category, threshold)
            label = int(prob_val >= category_threshold)
            predictions[category] = {
                'probability': prob_val,
                'classified': label == 1,
                'threshold': category_threshold
            }
        
        # Sort by probability
        sorted_predictions = sorted(predictions.items(), key=lambda x: x[1]['probability'], reverse=True)
        classified_categories = [cat for cat, pred in sorted_predictions if pred['classified']]
        
        return jsonify({
            'success': True,
            'message': message,
            'predictions': dict(sorted_predictions),
            'classified_categories': classified_categories,
            'total_categories': len(classified_categories),
            'max_confidence': max([pred['probability'] for pred in predictions.values()]) if predictions else 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bulk_classify', methods=['POST'])
def bulk_classify():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        threshold = data.get('threshold', 0.5)
        
        results = []
        for i, message in enumerate(messages):
            if not message.strip():
                continue
                
            y_pred_proba_list = model.predict_proba([message])
            
            predictions = {}
            for category, prob_array in zip(category_names, y_pred_proba_list):
                prob_val = float(prob_array[0][1])
                category_threshold = thresholds.get(category, threshold)
                label = int(prob_val >= category_threshold)
                predictions[category] = {
                    'probability': prob_val,
                    'classified': label == 1
                }
            
            classified_categories = [cat for cat, pred in predictions.items() if pred['classified']]
            
            results.append({
                'id': i,
                'message': message[:100] + "..." if len(message) > 100 else message,
                'classified_categories': classified_categories,
                'total_categories': len(classified_categories),
                'max_confidence': max([pred['probability'] for pred in predictions.values()]) if predictions else 0
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)