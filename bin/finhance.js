#!/usr/bin/env node

const { enhance } = require('../index');
const path = require('path');

const args = process.argv.slice(2);

function printHelp() {
    console.log(`
Finhance - Fingerprint Image Enhancement Wrapper

Usage:
  npx finhance <input_path> [options]

Options:
  --output, -o      Output directory path (default: <input_dir>/finhance_output)
  --recursive, -r   Recursively scan for images if input is a directory
  --format, -f      Output format: 'png' or 'jpg' (default: png)
  --keep-temp       Do not cleanup temp files during zip extraction
  --flip-only       Only flip the images horizontally (no enhancement)
  --flip            Flip images horizontally during enhancement
  --res             Enhance image resolution (1080p, 2k, 4k) to fix blur
  --help, -h        Show this help message

Examples:
  npx finhance ./images --output ./enhanced --recursive
  npx finhance archive.zip --format jpg
  npx finhance ./images --flip            # Enhance and flip
  npx finhance ./images --flip-only       # Just flip
  npx finhance ./images --res 4k          # Upscale and enhance to 4k resolution
    `);
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
}

const inputPath = args[0];
if (inputPath.startsWith('-')) {
    console.error("Error: Please provide a valid input path as the first argument.");
    printHelp();
    process.exit(1);
}

const options = {
    recursive: false,
    cleanup: true,
    flipOnly: false,
    flip: false,
    res: null,
    onProgress: (prog) => {
        console.log(`Processing [${prog.current}/${prog.total}]: ${prog.file}`);
    }
};

for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
        case '--output':
        case '-o':
            options.outputDir = args[++i];
            break;
        case '--recursive':
        case '-r':
            options.recursive = true;
            break;
        case '--format':
        case '-f':
            options.format = args[++i];
            break;
        case '--keep-temp':
            options.cleanup = false;
            break;
        case '--flip-only':
            options.flipOnly = true;
            break;
        case '--flip':
            options.flip = true;
            break;
        case '--res':
            options.res = args[++i];
            break;
        default:
            console.warn(`Unknown option ignored: ${args[i]}`);
    }
}

console.log(`Starting Finhance processing on: ${inputPath}...`);

enhance(inputPath, options)
    .then((results) => {
        const successes = results.filter(r => r.status === 'success');
        const errors = results.filter(r => r.status === 'error');
        
        console.log(`\nProcessing Complete!`);
        console.log(`- Successfully processed: ${successes.length} images`);
        if (errors.length > 0) {
            console.log(`- Failed: ${errors.length} images`);
            console.log(`\nSample Errors:`);
            console.log(errors.slice(0, 3).map(e => `  -> ${e.input}: ${e.error}`).join('\n'));
        }
    })
    .catch((err) => {
        console.error(`\nFatal Error: ${err.message}`);
        process.exit(1);
    });
