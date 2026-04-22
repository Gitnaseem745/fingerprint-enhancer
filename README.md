# finhance

A production-ready Node.js wrapper for high-performance python fingerprint image enhancement using Gabor filters. 

This package allows you to integrate complex python fingerprint enhancement directly into your Node.js pipelines effortlessly, or process images from your terminal using the built-in CLI.

## Requirements
Since the core enhancement engine is written in Python, you must have Python installed and available in your environment, along with the following packages:
```bash
pip install numpy opencv-python scipy
```

## Installation

Install locally inside your Node.js project:
```bash
npm install finhance
```

Or run directly via `npx` (make sure dependencies are installed!):
```bash
npx finhance <input_path>
```

## CLI Usage

The executable takes a file, directory, or `.zip` archive as input.

```bash
# Enhance a single image
npx finhance ./image.jpg --output ./results

# Recursively enhance a folder of images
npx finhance ./dataset --recursive

# Process an entire ZIP file automatically
npx finhance ./dataset.zip --format jpg

# Only flip images horizontally (no enhancement)
npx finhance ./dataset --flip-only

# Enhance AND flip images
npx finhance ./dataset --flip
```

### Options
*   `--output, -o`: Target output folder (Defaults to `<input_dir>/finhance_output`)
*   `--recursive, -r`: Recursively search subdirectories for images
*   `--format, -f`: Output image format (`png` or `jpg`)
*   `--flip-only`: Bypass enhancement and just flip the images horizontally
*   `--flip`: Applies enhancement AND flipping
*   `--keep-temp`: Prevent the system from cleaning up the temporary zip extraction folder

## API Usage

You can seamlessly integrate `finhance` into your Node.js code using `async/await`.

```javascript
const { enhance } = require('finhance');

async function processFingerprints() {
    try {
        const results = await enhance('./fingerprints.zip', {
            outputDir: './enhanced-output',
            recursive: true,
            format: 'png',
            flip: true // enhances and flips
        });

        const successes = results.filter(r => r.status === 'success');
        console.log(`Processed ${successes.length} images!`);
    } catch (e) {
        console.error("Execution failed:", e.message);
    }
}

processFingerprints();
```

### `enhance(inputPath, [options])`

**Returns**: `Promise<Array>` - An array of objects detailing the operation status (`success` or `error`) and output locations.

#### Options Object
*   **`outputDir`** *(string)* - Absolute or relative path to output directory
*   **`recursive`** *(boolean)* - Set to `true` to traverse subfolders (default: `false`)
*   **`format`** *(string)* - `"png"` or `"jpg"` (default: `"png"`)
*   **`cleanup`** *(boolean)* - Set to `false` to keep temp expanded zip files (default: `true`)
*   **`flipOnly`** *(boolean)* - Set to `true` to ONLY flip images, ignoring enhancement.
*   **`flip`** *(boolean)* - Set to `true` to perform both enhancement and flipping.

## Credits & Attribution

This npm package acts as an orchestrator wrapper around the excellent Python structural logic created by [Utkarsh-Deshmukh](https://github.com/Utkarsh-Deshmukh/Fingerprint-Enhancement-Python).
