import cv2
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter

def extract_palette_kmeans(image_path, num_colors=6):
    # Load image in BGR, convert to RGB
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Reshape to a list of pixels
    pixels = image.reshape((-1, 3))

    # Run KMeans to find clusters
    kmeans = KMeans(n_clusters=num_colors, n_init=10)
    labels = kmeans.fit_predict(pixels)
    counts = Counter(labels)

    # Sort colors by frequency
    center_colors = kmeans.cluster_centers_
    ordered_colors = [center_colors[i] for i in counts.keys()]
    sorted_colors_with_counts = sorted(zip(ordered_colors, counts.values()), key=lambda x: x[1], reverse=True)

    # Classify the top 3 colors as Primary, Secondary, and Tertiary
    primary_color = tuple(map(int, sorted_colors_with_counts[0][0]))
    secondary_color = tuple(map(int, sorted_colors_with_counts[1][0]))

    return {
        "primary": primary_color,
        "secondary": secondary_color,
    }



su