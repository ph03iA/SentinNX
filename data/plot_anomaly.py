import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os

EXPECTED_FEATURES = ["status", "size", "method", "path", "user_agent", "hour_of_day"]

features_path = os.path.join(os.path.dirname(__file__), 'features.csv')
model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'model.pkl')

df = pd.read_csv(features_path)
model = joblib.load(model_path)

df = df[EXPECTED_FEATURES].apply(pd.to_numeric, errors='coerce').dropna().astype("int")

df["prediction"] = model.predict(df)
df["label"] = df["prediction"].map({1: "Normal", -1: "Anomaly"})

plt.figure(figsize=(10, 6))
sns.scatterplot(
    data=df,
    x="size",
    y="user_agent",
    hue="label",
    palette={"Normal": "blue", "Anomaly": "red"},
    alpha=0.6
)

plt.title("Anomaly Detection: Blue = Normal, Red = Anomaly")
plt.xlabel("size")
plt.show()
