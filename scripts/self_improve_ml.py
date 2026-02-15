import json
import sys


def main():
    try:
        raw = sys.argv[1] if len(sys.argv) > 1 else "{}"
        payload = json.loads(raw)
    except Exception:
        payload = {}

    bookings = str(payload.get("bookings", ""))
    prefs = str(payload.get("prefs", ""))
    conversions = str(payload.get("conversions", ""))

    insights = []

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.cluster import KMeans

        corpus = [bookings, prefs, conversions]
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(corpus)

        kmeans = KMeans(n_clusters=min(2, len(corpus)), n_init=5, random_state=42)
        labels = kmeans.fit_predict(matrix)

        insights.append(f"Cluster labels: {labels.tolist()}")
        top_terms = []
        terms = vectorizer.get_feature_names_out()
        for center in kmeans.cluster_centers_:
            top_indices = center.argsort()[-5:]
            top_terms.extend([terms[i] for i in top_indices])
        if top_terms:
            insights.append("Top terms: " + ", ".join(sorted(set(top_terms))))
    except Exception:
        # If sklearn is unavailable, fallback with a basic heuristic
        if "family" in prefs.lower():
            insights.append("Family preference cluster detected; consider bundling kids activities.")
        if "anniversary" in bookings.lower():
            insights.append("Romance-related bookings rising; highlight couples packages.")

    print(json.dumps({"insights": insights}))


if __name__ == "__main__":
    main()
