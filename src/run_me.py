import cv2
import os
from fingerprint_enhancer.fingerprint_image_enhancer import FingerprintImageEnhancer

# 1. Initialize the enhancer
image_enhancer = FingerprintImageEnhancer()

# 2. Setup paths relative to this script
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

# Define source and target directories
source_base_dir = os.path.join(project_root, '3428213505-Salempur')
target_base_dir = os.path.join(project_root, 'enhanced')

# The batches to process
batches = ['501', '503']

for batch in batches:
    batch_dir = os.path.join(source_base_dir, batch)
    if not os.path.exists(batch_dir):
        print(f"Directory not found: {batch_dir}, skipping...")
        continue
        
    print(f"\\n[{batch}] Processing started...")
    
    # Iterate over all student folders within the batch
    for student_folder in os.listdir(batch_dir):
        student_path = os.path.join(batch_dir, student_folder)
        
        if not os.path.isdir(student_path):
            continue
            
        print(f"  -> Processing student: {student_folder}")
        
        # Create corresponding target directory for the student
        target_student_dir = os.path.join(target_base_dir, batch, student_folder)
        os.makedirs(target_student_dir, exist_ok=True)
        
        # Supported image extensions
        valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
        
        # Process all images in the structured folder
        for img_name in os.listdir(student_path):
            if not img_name.lower().endswith(valid_extensions):
                continue
                
            img_path = os.path.join(student_path, img_name)
            
            # Read the image in grayscale (the '0' is important)
            img = cv2.imread(img_path, 0)
            
            if img is None:
                print(f"     [Error] Could not read image: {img_name}")
                continue
            
            try:
                # Enhance!
                # invert_output=True makes ridges black and background white
                enhanced_img = image_enhancer.enhance(img, invert_output=True)

                # Save the enhanced high-quality result
                save_path = os.path.join(target_student_dir, img_name)
                cv2.imwrite(save_path, (255 * enhanced_img))
                # print(f"     [Success] Saved {img_name}") # Uncomment to see per-file success logs
            except Exception as e:
                print(f"     [Error] Failed to process {img_name}: {str(e)}")

print("\\nBulk processing complete!")
