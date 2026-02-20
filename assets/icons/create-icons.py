#!/usr/bin/env python3
"""
Simple script to create PNG icons for the Chrome extension.
Requires: PIL/Pillow (pip install pillow)
Usage: python create-icons.py
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip install pillow")
    print("\nOr use the generate-icons.html file instead (no installation needed)!")
    exit(1)

def draw_accessibility_icon(size):
    """Draw accessibility icon on a canvas"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Blue circle background
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill='#0056b3', outline='#0056b3')
    
    # Scale for drawing
    scale = size / 24
    center_x = size / 2
    center_y = size / 2
    
    # White color for icon
    white = '#ffffff'
    line_width = max(1, int(scale * 1.2))
    
    # Head (circle)
    head_radius = scale * 1.8
    head_y = center_y - scale * 5
    draw.ellipse([center_x - head_radius, head_y - head_radius,
                  center_x + head_radius, head_y + head_radius],
                 fill=white, outline=white)
    
    # Body (vertical line)
    body_top = center_y - scale * 3
    body_bottom = center_y + scale * 3
    draw.line([center_x, body_top, center_x, body_bottom],
              fill=white, width=line_width)
    
    # Left arm
    arm_y = center_y - scale * 2
    left_arm_x = center_x - scale * 4
    left_arm_y = center_y - scale * 4.5
    draw.line([center_x, arm_y, left_arm_x, left_arm_y],
              fill=white, width=line_width)
    
    # Right arm
    right_arm_x = center_x + scale * 4
    right_arm_y = center_y - scale * 4.5
    draw.line([center_x, arm_y, right_arm_x, right_arm_y],
              fill=white, width=line_width)
    
    # Left leg
    leg_top = center_y + scale * 3
    left_leg_x = center_x - scale * 3
    left_leg_y = center_y + scale * 7
    draw.line([center_x, leg_top, left_leg_x, left_leg_y],
              fill=white, width=line_width)
    
    # Right leg
    right_leg_x = center_x + scale * 3
    right_leg_y = center_y + scale * 7
    draw.line([center_x, leg_top, right_leg_x, right_leg_y],
              fill=white, width=line_width)
    
    return img

def main():
    """Create all three icon sizes"""
    sizes = [16, 48, 128]
    
    print("Creating extension icons...")
    print("-" * 40)
    
    for size in sizes:
        filename = f'icon-{size}.png'
        img = draw_accessibility_icon(size)
        img.save(filename)
        print(f"✓ Created {filename} ({size}×{size} pixels)")
    
    print("-" * 40)
    print("\n✅ All icons created successfully!")
    print("\nNext steps:")
    print("1. Icons are saved in the current directory")
    print("2. Make sure they're in: accessibility-chrome-extension/assets/icons/")
    print("3. Reload the extension in chrome://extensions/")
    print("4. Your custom icons should now appear!")

if __name__ == '__main__':
    main()
