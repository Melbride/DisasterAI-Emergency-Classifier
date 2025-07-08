# Mock model for deployment without actual pkl files
import random

class MockModel:
    def predict_proba(self, messages):
        # Return mock probabilities matching real model format
        categories = ['medical_help', 'water', 'food', 'shelter', 'aid_related', 'request', 'direct_report']
        results = []
        
        # For each category, return array for all messages
        for cat in categories:
            category_results = []
            for _ in messages:
                # Generate realistic probabilities [negative_class, positive_class]
                prob = random.uniform(0.1, 0.95)
                category_results.append([1-prob, prob])
            results.append(category_results)
        
        return results

mock_model = MockModel()
mock_categories = ['medical_help', 'water', 'food', 'shelter', 'aid_related', 'request', 'direct_report']
mock_thresholds = {cat: 0.5 for cat in mock_categories}