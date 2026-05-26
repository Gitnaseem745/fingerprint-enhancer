#!/usr/bin/env node

const { enhance } = require('../index');
const path = require('path');
const fs = require('fs');
const log = require('../lib/logger');

const PKG = require('../package.json');
const args = process.argv.slice(2);

function printHelp() {
    log.printBanner(PKG.version);
    console.log(`${log.C.bold}  USAGE${log.C.reset}`);
    console.log(`    npx finhance <input_path> [options]`);
    console.log();
    console.log(`${log.C.bold}  OPTIONS${log.C.reset}`);
    console.log(`    --output, -o      Output directory path (default: <input_dir>/finhance_output)`);
    console.log(`    --recursive, -r   Recursively scan for images if input is a directory`);
    console.log(`    --format, -f      Output format: 'png' or 'jpg' (default: png)`);
    console.log(`    --keep-temp       Do not cleanup temp files during zip extraction`);
    console.log(`    --flip-only       Only flip the images horizontally (no enhancement)`);
    console.log(`    --flip            Flip images horizontally during enhancement`);
    console.log(`    --res             Enhance image resolution (1080p, 2k, 4k) to fix blur`);
    console.log(`    --help, -h        Show this help message`);
    console.log();
    console.log(`${log.C.bold}  SUPPORTED FORMATS${log.C.reset}`);
    console.log(`    .jpg  .jpeg  .png  .bmp  .dib  .tif  .tiff`);
    console.log();
    console.log(`${log.C.bold}  EXAMPLES${log.C.reset}`);
    console.log(`    npx finhance ./fingerprint.dib --output ./enhanced`);
    console.log(`    npx finhance ./dataset --recursive --format jpg`);
    console.log(`    npx finhance archive.zip --res 4k`);
    console.log(`    npx finhance ./images --flip-only`);
    console.log();
}

// ── Show help ───────────────────────────────────────────────────────
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
}

// ── Parse arguments ─────────────────────────────────────────────────
const inputPath = args[0];
if (inputPath.startsWith('-')) {
    log.error("Please provide a valid input path as the first argument.");
    printHelp();
    process.exit(1);
}

const options = {
    recursive: false,
    cleanup: true,
    flipOnly: false,
    flip: false,
    res: null,
};

for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
        case '--output': case '-o':
            options.outputDir = args[++i];
            break;
        case '--recursive': case '-r':
            options.recursive = true;
            break;
        case '--format': case '-f':
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
            log.warn(`Unknown option ignored: ${args[i]}`);
    }
}

// ── Main execution ──────────────────────────────────────────────────
async function run() {
    const startTime = Date.now();

    // Banner
    log.printBanner(PKG.version);

    // Validate input exists
    const resolved = path.resolve(inputPath);
    log.section('Input Validation');
    if (!fs.existsSync(resolved)) {
        log.error(`Input path not found: ${resolved}`);
        process.exit(1);
    }

    const stat = fs.statSync(resolved);
    const ext = path.extname(resolved).toLowerCase();

    if (stat.isFile()) {
        log.info(`Input type   : ${log.C.white}Single file${log.C.reset}`);
        log.info(`File         : ${log.C.white}${path.basename(resolved)}${log.C.reset}`);
        log.info(`Size         : ${log.C.white}${log.formatBytes(stat.size)}${log.C.reset}`);
        log.info(`Extension    : ${log.C.white}${ext || '(none)'}${log.C.reset}`);
        if (ext === '.zip') {
            log.info(`Archive mode : ${log.C.yellow}ZIP extraction enabled${log.C.reset}`);
        }
    } else if (stat.isDirectory()) {
        log.info(`Input type   : ${log.C.white}Directory${log.C.reset}`);
        log.info(`Path         : ${log.C.white}${resolved}${log.C.reset}`);
        log.info(`Recursive    : ${log.C.white}${options.recursive ? 'Yes' : 'No'}${log.C.reset}`);
    }

    log.success('Input validated');

    // Config
    log.printConfig({
        input:     resolved,
        outputDir: options.outputDir,
        format:    options.format,
        recursive: options.recursive,
        flipOnly:  options.flipOnly,
        flip:      options.flip,
        res:       options.res,
        cleanup:   options.cleanup,
    });

    // Processing
    log.section('Processing');
    log.info('Initializing Python enhancement engine...');

    options.onProgress = (prog) => {
        log.progress(prog.current, prog.total, prog.file);
    };

    const results = await enhance(inputPath, options);
    const elapsed = Date.now() - startTime;

    // Summary
    log.printSummary(results, elapsed);
}

run().catch((err) => {
    log.error(`Fatal: ${err.message}`);
    process.exit(1);
});
