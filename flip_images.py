import os
import sys
import argparse
from PIL import Image

def flip_images(input_dir, output_dir):
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
    
    if not os.path.exists(input_dir):
        print(f"Error: Input directory '{input_dir}' does not exist.")
        sys.exit(1)
        
    print(f"Starting to flip images from '{input_dir}' to '{output_dir}'")
    
    success_count = 0
    fail_count = 0
    
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(valid_extensions):
                input_path = os.path.join(root, file)
                
                # Maintain subfolder structure
                rel_path = os.path.relpath(input_path, input_dir)
                output_path = os.path.join(output_dir, rel_path)
                
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                try:
                    # Open the image, flip horizontally, and save
                    with Image.open(input_path) as img:
                        flipped_img = img.transpose(Image.FLIP_LEFT_RIGHT)
                        flipped_img.save(output_path)
                    success_count += 1
                except Exception as e:
                    print(f"  [Error] Could not process image {input_path}: {e}")
                    fail_count += 1
                    
    print(f"Bulk flipping complete! Successfully flipped {success_count} images. Failed: {fail_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk flip images horizontally.")
    parser.add_argument("input_dir", type=str, help="Source directory containing images to flip.")
    parser.add_argument("output_dir", type=str, nargs='?', default="flipped_&_enhanced", help="Destination directory (default: flipped_&_enhanced)")
    
    args = parser.parse_args()
    
    flip_images(args.input_dir, args.output_dir)
