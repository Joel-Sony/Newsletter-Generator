from colourExtractor import extract_palette_kmeans
import matplotlib.pyplot as plt
import os
import math
import pickle
from time import perf_counter

start = perf_counter()

def show_palettes(user, match):
    fig, ax = plt.subplots(2, 2, figsize=(4, 2))

    titles = ['Primary', 'Secondary']
    for i, key in enumerate(['primary', 'secondary']):
        ax[0, i].imshow([[user[key]]])
        ax[0, i].set_title(f"User {titles[i]}")
        ax[0, i].axis('off')

        ax[1, i].imshow([[match[key]]])
        ax[1, i].set_title(f"Match {titles[i]}")
        ax[1, i].axis('off')

    plt.tight_layout()
    plt.savefig("color_match_preview.png")
    os.system("xdg-open color_match_preview.png")

# --- Main Script ---

with open('template.pkl', 'rb') as f:
    templates = pickle.load(f)

user_colors = extract_palette_kmeans(
    "./images/School-newsletter-2-web-712x984-1.jpeg",
    num_colors=4
)

print(f"User: {user_colors}")

show_palettes(user_colors)

end = perf_counter()
print(f"\nTook {end - start:.4f} seconds")
