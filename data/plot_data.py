import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

features_path = os.path.join(os.path.dirname(__file__), 'features.csv')
df = pd.read_csv(features_path)

fig, axes = plt.subplots(2, 3, figsize=(18, 10))
plt.tight_layout(pad=5)

sns.countplot(x="status", data=df, ax=axes[0, 0])
axes[0, 0].set_title("HTTP Status Code Distribution")
axes[0, 0].set_xlabel("Status Code")
axes[0, 0].set_ylabel("Count")

sns.histplot(df["size"], bins=50, kde=True, ax=axes[0, 1])
axes[0, 1].set_title("Distribution of Response Sizes")
axes[0, 1].set_xlabel("Size")
axes[0, 1].set_ylabel("Frequency")

sns.countplot(x="hour_of_day", data=df, ax=axes[0, 2])
axes[0, 2].set_title("Requests per Hour")
axes[0, 2].set_xlabel("Hour of Day")
axes[0, 2].set_ylabel("Request Count")

sns.countplot(x="method", data=df, ax=axes[1, 0])
axes[1, 0].set_title("HTTP Method Distribution")
axes[1, 0].set_xlabel("Method (encoded)")
axes[1, 0].set_ylabel("Count")

sns.heatmap(df.corr(), annot=True, cmap="coolwarm", ax=axes[1, 1])
axes[1, 1].set_title("Feature Correlation Heatmap")

axes[1, 2].axis('off')

plt.show()
