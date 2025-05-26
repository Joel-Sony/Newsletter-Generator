import pickle
# import random
# from collections import defaultdict

# def save_index(index, filename="template_index.pkl"):
#     """
#     Save the precomputed index to a file.
#     :param index: The index to save
#     :param filename: The filename to save the index as
#     """
#     with open(filename, "wb") as f:
#         pickle.dump(index, f)


# def load_templates(filename="templates.pkl"):
#     """
#     Load precomputed templates from a file.
#     :param filename: The filename to load the templates from
#     :return: The loaded templates
#     """
#     with open(filename, "rb") as f:
#         return pickle.load(f)


# def quantize_color(rgb, levels=8):
#     """
#     Quantize the RGB color by reducing its precision.
#     :param rgb: Tuple of RGB values (r, g, b)
#     :param levels: Number of quantization levels (default 8)
#     :return: A quantized color tuple
#     """
#     factor = 256 // levels
#     return tuple((c // factor) * factor for c in rgb)


# def build_sorted_index(templates, levels=8):
#     """
#     Build a precomputed index for templates based on quantized RGB colors.
#     :param templates: Dictionary containing templates with primary, secondary, tertiary colors
#     :param levels: Number of quantization levels for RGB colors (default 8)
#     :return: A dictionary of precomputed indices
#     """
#     index = defaultdict(list)

#     for name, colors in templates.items():
#         # Quantize each color (primary, secondary, tertiary)
#         primary_bucket = quantize_color(colors['primary'], levels)
#         secondary_bucket = quantize_color(colors['secondary'], levels)
#         tertiary_bucket = quantize_color(colors['tertiary'], levels)

#         # Create a key using the quantized primary, secondary, and tertiary colors
#         index[(primary_bucket, secondary_bucket, tertiary_bucket)].append((name, colors))

#     return index


# if __name__ == "__main__":
#     # Load precomputed templates from templates.pkl
#     templates = load_templates("templates.pkl")


#     # Build the precomputed index for templates
#     index = build_sorted_index(templates)

#     # Save the index to a file
#     save_index(index, "template_index.pkl")

import random
import colorsys
import pickle

def hsl_to_rgb(h, s, l):
    """Convert HSL (Hue 0-1, Sat 0-1, Light 0-1) to RGB (0-255)"""
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return tuple(int(x * 255) for x in (r, g, b))

def generate_color_in_range(color_type):
    """
    Generate realistic newsletter-appropriate colors:
    - Primary: Lighter/pastel colors (backgrounds, headers)
    - Secondary: A full range of shades for each primary color (darker and more varied)
    """
    base_hue = random.random()  # Shared base hue for harmony
    
    if color_type == 'primary':
        # Lighter colors (pastels) with high lightness (close to white)
        return hsl_to_rgb(base_hue, random.uniform(0.2, 0.4), random.uniform(0.85, 0.95))

    elif color_type == 'secondary':
        # A full range of hues for the secondary color, varying saturation and lightness
        # This will create multiple shades, both dark and bright, for each primary hue
        return hsl_to_rgb(
            base_hue,  # Same hue as the primary for color consistency
            random.uniform(0.4, 1.0),  # Varying saturation (lower for muted, higher for vivid)
            random.uniform(0.2, 0.75)  # Varying lightness from darker to lighter shades
        )

    else:
        raise ValueError("Invalid color type")


def generate_templates(num_templates=100000):
    templates = {}

    for i in range(1, num_templates + 1):
        template_name = f"template_{i}"
        primary = generate_color_in_range('primary')
        secondary = generate_color_in_range('secondary')

        templates[template_name] = {
            "primary": primary,
            "secondary": secondary
        }

    return templates

if __name__ == "__main__":
    templates = generate_templates()
    
    with open('template.pkl', 'wb') as f:
        pickle.dump(templates, f)
