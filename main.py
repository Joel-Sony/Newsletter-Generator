from imageExtractor import extract_palette_kmeans
import matplotlib.pyplot as plt
import os
import math
import pickle
from time import perf_counter

start = perf_counter()

def load_index(filename="template_index.pkl"):
    """
    Load the precomputed index from a file.
    :param filename: The filename to load the index from
    :return: The loaded index
    """
    with open(filename, "rb") as f:
        return pickle.load(f)


def color_distance(c1, c2):
    return math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2 + (c1[2] - c2[2])**2)

def find_closest_template(user_colors, templates):
    closest_template = None
    min_distance = float('inf')

    for template_name, template_colors in templates.items():
        primary_distance = color_distance(user_colors["primary"], template_colors["primary"])
        secondary_distance = color_distance(user_colors["secondary"], template_colors["secondary"])
        total_distance = primary_distance + secondary_distance

        if total_distance < min_distance:
            min_distance = total_distance
            closest_template = template_name

    return closest_template

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

start = perf_counter()

with open('template.pkl', 'rb') as f:
    templates = pickle.load(f)

user_colors = extract_palette_kmeans(
    "./images/School-newsletter-2-web-712x984-1.jpeg",
    num_colors=4
)

closestTemplate = find_closest_template(user_colors, templates)
print(f"User: {user_colors}")
print(f"Closest: {templates[closestTemplate]}")

show_palettes(user_colors, templates[closestTemplate])

end = perf_counter()
print(f"\nTook {end - start:.4f} seconds")
