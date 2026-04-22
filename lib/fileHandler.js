const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff']);

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

/**
 * Recursively find all images in a given directory
 */
async function findImages(dir) {
    let results = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subResults = await findImages(fullPath);
            results = results.concat(subResults);
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (VALID_EXTENSIONS.has(ext)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

/**
 * Handle zip files, extract to temp, and return temp directory path
 */
async function extractZip(zipPath) {
    const zipName = path.basename(zipPath, path.extname(zipPath));
    const extractPath = path.join(process.cwd(), 'temp', `finhance_extracted_${Date.now()}_${zipName}`);
    
    await ensureDir(extractPath);
    
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    
    return extractPath;
}

/**
 * Cleanup temp directory
 */
async function cleanupTemp(dirPath) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
        console.error(`Failed to cleanup temp path: ${dirPath}`, error);
    }
}

module.exports = {
    findImages,
    extractZip,
    cleanupTemp,
    ensureDir,
    VALID_EXTENSIONS
};
