# 🖐️ Fingerprint Enhancement Guide for Personal Use

This guide will help you use this tool to enhance your own fingerprint images on your local machine.

---

## 1. Prerequisites
Before you start, make sure you have the required Python libraries installed. Open your terminal in the project folder and run:

```powershell
pip install numpy opencv-python scipy
```

> [!TIP]
> On Windows, if `python` doesn't work, always try using **`py`** instead.

---

## 2. Project Layout
To keep things simple, organize your files as follows:

*   **`images/`**: Put your original, noisy fingerprint images here (e.g., `my_fingerprint.jpg`).
*   **`src/`**: Contains the code that does the work.
*   **`enhanced/`**: This folder will be created automatically to store your clean results.

---

## 3. How to Enhance Your Images

### Option A: Using the Example Script (Easiest)
1.  Place your fingerprint image (e.g., `test.jpg`) into the `images` folder.
2.  Open your terminal in the main project folder.
3.  Run this command:
    ```powershell
    py src/example.py 2.jpg
    ```
    *Note: If you run it without an argument, it processes the default `1.jpg` sample.*

### Option B: Creating Your Own Simple Script
If you want to process images from any location, create a new file (e.g., `run_me.py`) in the **`src`** folder with this code:

```python
import cv2
import os
from fingerprint_enhancer.fingerprint_image_enhancer import FingerprintImageEnhancer

# 1. Initialize the enhancer
image_enhancer = FingerprintImageEnhancer()

# 2. Path to your image
img_path = '../images/1.jpg'  # Change this to your filename

# 3. Read the image in grayscale (the '0' is important)
img = cv2.imread(img_path, 0)

if img is None:
    print(f"Error: Could not find image at {img_path}")
else:
    # 4. Enhance! 
    # invert_output=True makes ridges black and background white
    enhanced_img = image_enhancer.enhance(img, invert_output=True)

    # 5. Create enhanced folder if it doesn't exist
    if not os.path.exists('../enhanced'):
        os.makedirs('../enhanced')

    # 6. Save the result
    save_path = '../enhanced/result.jpg'
    cv2.imwrite(save_path, (255 * enhanced_img))
    print(f"Success! Saved to {save_path}")
```

---

## 4. Troubleshooting

### "Python was not found"
If you see this, Windows' default settings are getting in the way.
*   **Quick Fix**: Use `py` instead of `python` in your commands.
*   **Permanent Fix**: Search for "App execution aliases" in your Windows settings and turn **OFF** the switches for Python.

### Image not loading
Ensure your image is in the `images` folder and the name matches exactly (including `.jpg`, `.png`, etc.). The code treats filenames as case-sensitive.

### Results looking strange
*   **Ridges are white?** Change `invert_output=True` to `False` in the `enhance()` function.
*   **Image is too blurry?** The tool works best on 500dpi scans. If your image is very low resolution, the Gabor filters might not detect the ridges correctly.
