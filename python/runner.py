import sys
import json
import cv2
import traceback
import os
import numpy as np
from fingerprint_enhancer.fingerprint_image_enhancer import FingerprintImageEnhancer

def process_image(job, enhancer):
    input_path = job.get('input')
    output_path = job.get('output')
    flip_only = job.get('flip_only', False)
    flip = job.get('flip', False)
    target_res = job.get('res')
    
    if not os.path.exists(input_path):
        return {"status": "error", "error": f"Input path does not exist: {input_path}"}
        
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if flip_only:
            # Just read, flip, save
            img = cv2.imread(input_path)
            if img is None:
                return {"status": "error", "error": f"Could not read image: {input_path}"}
            flipped = cv2.flip(img, 1)
            cv2.imwrite(output_path, flipped)
            return {"status": "success", "output": output_path}
            
        # Enhance path
        img = cv2.imread(input_path, 0)
        if img is None:
            return {"status": "error", "error": f"Could not read grayscale image: {input_path}"}
            
        # Optional flip before enhancement
        if flip:
            img = cv2.flip(img, 1)
            
        enhanced_img = enhancer.enhance(img, invert_output=True)
        out_img = (255 * enhanced_img).astype(np.uint8)
        
        if target_res:
            target_res_lower = str(target_res).lower()
            h, w = out_img.shape[:2]
            target_size = max(h, w)
            
            if target_res_lower == '1080p':
                target_size = 1920
            elif target_res_lower == '2k':
                target_size = 2560
            elif target_res_lower == '4k':
                target_size = 3840
                
            scale = target_size / max(h, w)
            if scale > 1.0:
                out_img = cv2.resize(out_img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LANCZOS4)
                
        cv2.imwrite(output_path, out_img)
        
        return {"status": "success", "output": output_path}
        
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing JSON payload argument"}))
        sys.exit(1)
        
    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        print(json.dumps({"error": f"JSON payload file not found: {json_path}"}))
        sys.exit(1)
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}))
        sys.exit(1)
        
    # Lazy initialization of enhancer only if we actually need it
    enhancer = None
    needs_enhancer = any(not job.get('flip_only', False) for job in jobs)
    if needs_enhancer:
        try:
            enhancer = FingerprintImageEnhancer()
        except Exception as e:
            print(json.dumps({"error": f"Failed to initialize enhancer: {str(e)}"}))
            sys.exit(1)
            
    results = []
    total = len(jobs)
    for i, job in enumerate(jobs):
        file_name = os.path.basename(job.get('input', ''))
        progress_msg = {"current": i + 1, "total": total, "file": file_name}
        print(f"___FINHANCE_PROGRESS___={json.dumps(progress_msg)}", flush=True)
        
        res = process_image(job, enhancer)
        res['input'] = job.get('input')
        results.append(res)
        
    print("___FINHANCE_OUTPUT___=" + json.dumps({"results": results}))

if __name__ == "__main__":
    main()
