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

def generate_color_in_range(color_type):
    """
    Generate a random color based on predefined color ranges.
    :param color_type: Type of color ('primary', 'secondary', 'tertiary')
    :return: A tuple of RGB values representing a color
    """
    if color_type == 'primary':
        # Primary colors can range from soft blues, reds, greens
        return (
            random.randint(50, 200),  # Red channel (Soft)
            random.randint(50, 150),  # Green channel (Soft)
            random.randint(100, 255)  # Blue channel (More prominent)
        )
    elif color_type == 'secondary':
        # Secondary colors can be neutral tones or softer complementary shades
        return (
            random.randint(100, 180),  # Red channel (Muted)
            random.randint(50, 180),   # Green channel (Muted)
            random.randint(100, 180)   # Blue channel (Muted)
        )
    elif color_type == 'tertiary':
        # Tertiary colors can be light neutrals or complementary accents
        return (
            random.randint(180, 255),  # Red channel (Light)
            random.randint(180, 255),  # Green channel (Light)
            random.randint(180, 255)   # Blue channel (Light)
        )
    else:
        raise ValueError("Invalid color type")

def generate_templates(num_templates=100000):
    templates = {}

    for i in range(1, num_templates + 1):
        template_name = f"template_{i}"
        primary = generate_color_in_range('primary')
        secondary = generate_color_in_range('secondary')
        tertiary = generate_color_in_range('tertiary')

        templates[template_name] = {
            "primary": primary,
            "secondary": secondary,
            "tertiary": tertiary
        }

    return templates

if __name__ == "__main__":
    templates = generate_templates()
    
    with open('template.pkl','wb') as f:
        pickle.dump(templates,f)
    