import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

features_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'features.csv')
model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'model.pkl')

df = pd.read_csv(features_path)

X_train = df

model = IsolationForest(contamination="auto", random_state=42)
model.fit(X_train)

joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
