import os
import sys
import cv2
from fingerprint_enhancer.fingerprint_image_enhancer import FingerprintImageEnhancer

if __name__ == "__main__":
    # Get the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # The 'images' and 'enhanced' folders are in the parent directory of 'src'
    project_root = os.path.dirname(current_dir)
    
    image_enhancer = FingerprintImageEnhancer()

    if len(sys.argv) < 2:
        print("Loading sample image (1.jpg)...")
        IMG_NAME = "1.jpg"
    else:
        IMG_NAME = sys.argv[1]

    # Build the path to the image
    img_path = os.path.join(project_root, "images", IMG_NAME)
    img = cv2.imread(img_path)

    if img is None:
        print(f"Error: Could not find or read image at: {img_path}")
        sys.exit(1)

    if len(img.shape) > 2:  # convert image into gray if necessary
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    print(f"Enhancing {IMG_NAME}...")
    image_enhancer.enhance(img, invert_output=True)  # run image enhancer
    
    # Save output to the 'enhanced' folder in the project root
    save_path = os.path.join(project_root, "enhanced", IMG_NAME)
    image_enhancer.save_enhanced_image(save_path)  # save output
    print(f"Success! Saved to: {save_path}")
