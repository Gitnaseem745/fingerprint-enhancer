const fs = require('fs').promises;
const path = require('path');
const { findImages, extractZip, cleanupTemp, ensureDir } = require('./fileHandler');
const { executePythonRunner } = require('./pythonRunner');

/**
 * Main API function to enhance fingerprint images
 * @param {string} inputPath - File, folder, or zip path
 * @param {object} options
 * @param {string} [options.outputDir] - Target directory for output images (default: inputPath directory + '/finhance_output')
 * @param {boolean} [options.recursive] - Whether to recurse into subdirectories (default: false)
 * @param {string} [options.format] - Output format: "png" or "jpg" (default: "png")
 * @param {boolean} [options.cleanup] - Whether to clean up temp files if from a zip (default: true)
 * @param {boolean} [options.flipOnly] - If true, ONLY flips the images without enhancing (default: false)
 * @param {boolean} [options.flip] - If true, flips images during enhancement. Ignored if flipOnly is true (default: false)
 */
async function enhance(inputPath, options = {}) {
    const rootInput = path.resolve(inputPath);
    
    // Defaults
    const config = {
        outputDir: options.outputDir ? path.resolve(options.outputDir) : null,
        recursive: options.recursive ?? false,
        format: options.format ?? "png",
        cleanup: options.cleanup ?? true,
        flipOnly: options.flipOnly ?? false,
        flip: options.flip ?? false,
    };

    let filesToProcess = [];
    let isZip = false;
    let extractionTempPath = null;
    let baseInputDir = null;

    try {
        const stat = await fs.stat(rootInput);

        if (stat.isFile()) {
            const ext = path.extname(rootInput).toLowerCase();
            if (ext === '.zip') {
                isZip = true;
                extractionTempPath = await extractZip(rootInput);
                baseInputDir = extractionTempPath;
                filesToProcess = await findImages(extractionTempPath);
            } else {
                baseInputDir = path.dirname(rootInput);
                filesToProcess = [rootInput];
            }
        } else if (stat.isDirectory()) {
            baseInputDir = rootInput;
            if (config.recursive) {
                filesToProcess = await findImages(rootInput);
            } else {
                // Find only the immediate children but ignore subdirectories
                let tempResults = await findImages(rootInput);
                filesToProcess = tempResults.filter(f => path.dirname(f) === rootInput);
            }
        } else {
            throw new Error(`Invalid input type for ${rootInput}`);
        }

        if (filesToProcess.length === 0) {
            console.log("No valid images found to process.");
            return [];
        }

        // Determine destination root directory
        const destinationRoot = config.outputDir || path.join(isZip ? path.dirname(rootInput) : baseInputDir, 'finhance_output');
        await ensureDir(destinationRoot);

        // Prep jobs
        const jobs = filesToProcess.map(filePath => {
            // Replicate nested structure relative to base input dir
            const relativePath = path.relative(baseInputDir, filePath);
            const parsed = path.parse(relativePath);
            
            // Build new output filename
            const outExt = `.${config.format}`;
            const outName = `${parsed.name}_finhanced${outExt}`;
            const targetPath = path.join(destinationRoot, parsed.dir, outName);
            
            return {
                input: filePath,
                output: targetPath,
                flip_only: config.flipOnly,
                flip: config.flip
            };
        });

        // Batch processing using single python spawned process
        const results = await executePythonRunner(jobs, options.onProgress);
        return results;

    } catch (e) {
        throw new Error(`finhance failed: ${e.message}`);
    } finally {
        if (isZip && extractionTempPath && config.cleanup) {
            await cleanupTemp(extractionTempPath);
        }
    }
}

module.exports = {
    enhance
};
