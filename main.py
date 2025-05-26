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

# def find_closest_template(user_colors, index, levels=8):
#     """
#     Find the closest template to the user's colors from the precomputed index.
#     :param user_colors: A dictionary containing the user's primary, secondary, and tertiary colors
#     :param index: The precomputed index of templates
#     :param levels: Number of quantization levels for RGB colors (default 8)
#     :return: The name of the closest template
#     """
#     # Quantize the user's primary, secondary, and tertiary colors
#     user_primary_bucket = quantize_color(user_colors['primary'], levels)
#     user_secondary_bucket = quantize_color(user_colors['secondary'], levels)
#     user_tertiary_bucket = quantize_color(user_colors['tertiary'], levels)

#     # Find the closest candidates in the index
#     candidates = index.get((user_primary_bucket, user_secondary_bucket, user_tertiary_bucket), [])

#     if not candidates:
#         # If no exact match is found, try finding by primary color only
#         candidates = index.get((user_primary_bucket, (0, 0, 0), (0, 0, 0)), [])

#     if not candidates:
#         # If no match is found, fallback to finding by primary and secondary color
#         candidates = index.get((user_primary_bucket, user_secondary_bucket, (0, 0, 0)), [])

#     # Find the closest template among the candidates
#     closest_template = None
#     min_distance = float('inf')  # Start with an infinitely large distance

#     for template_name, template_colors in candidates:
#         # Calculate distance for primary, secondary, and tertiary colors
#         primary_distance = color_distance(user_colors["primary"], template_colors["primary"])
#         secondary_distance = color_distance(user_colors["secondary"], template_colors["secondary"])
#         tertiary_distance = color_distance(user_colors["tertiary"], template_colors["tertiary"])

#         # Sum the distances
#         total_distance = primary_distance + secondary_distance + tertiary_distance

#         if total_distance < min_distance:
#             min_distance = total_distance
#             closest_template = template_name

#     return closest_template

def find_closest_template(user_colors, templates):
    closest_template = None
    min_distance = float('inf')

    for template_name, template_colors in templates.items():
        primary_distance = color_distance(user_colors["primary"], template_colors["primary"])
        secondary_distance = color_distance(user_colors["secondary"], template_colors["secondary"])
        tertiary_distance = color_distance(user_colors["tertiary"], template_colors["tertiary"])
        total_distance = primary_distance + secondary_distance + tertiary_distance

        if total_distance < min_distance:
            min_distance = total_distance
            closest_template = template_name

    return closest_template

def show_palettes(user, match):
    fig, ax = plt.subplots(2, 3, figsize=(6, 2))

    titles = ['Primary', 'Secondary', 'Tertiary']

    for i, key in enumerate(['primary', 'secondary', 'tertiary']):
        ax[0, i].imshow([[user[key]]])
        ax[0, i].set_title(f"User {titles[i]}")
        ax[0, i].axis('off')

        ax[1, i].imshow([[match[key]]])
        ax[1, i].set_title(f"Match {titles[i]}")
        ax[1, i].axis('off')

    plt.tight_layout()
    plt.savefig("color_match_preview.png")
    os.system("xdg-open color_match_preview.png") 



with open('template.pkl','rb') as f:
    templates = pickle.load(f)

user_colors = extract_palette_kmeans("./images/component.jpg",num_colors=6)

closestTemplate = find_closest_template(user_colors, templates)
print(f"User:{user_colors}")
print(f"Closest: {templates[closestTemplate]}")

show_palettes(user_colors, templates[closestTemplate])
end = perf_counter()
print(f"\nTook {end - start:.4f} seconds")