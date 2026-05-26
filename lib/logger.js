/**
 * Production-grade CLI logger with ANSI colors and structured output.
 * Zero dependencies — uses raw escape codes.
 */

const path = require('path');

// ── ANSI color codes ────────────────────────────────────────────────
const C = {
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    italic:  '\x1b[3m',
    under:   '\x1b[4m',
    red:     '\x1b[31m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    blue:    '\x1b[34m',
    magenta: '\x1b[35m',
    cyan:    '\x1b[36m',
    white:   '\x1b[37m',
    gray:    '\x1b[90m',
    bgRed:   '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow:'\x1b[43m',
    bgBlue:  '\x1b[44m',
    bgCyan:  '\x1b[46m',
};

// ── Helpers ─────────────────────────────────────────────────────────
function timestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function pad(str, len) {
    return String(str).padEnd(len);
}

function hrLine(char = '─', len = 60) {
    return C.dim + char.repeat(len) + C.reset;
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatMs(ms) {
    if (ms < 1000) return ms + 'ms';
    return (ms / 1000).toFixed(2) + 's';
}

// ── Banner ──────────────────────────────────────────────────────────
function printBanner(version) {
    const banner = `
${C.cyan}${C.bold}    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   ███████╗██╗███╗   ██╗██╗  ██╗ █████╗ ███╗   ██╗    ║
    ║   ██╔════╝██║████╗  ██║██║  ██║██╔══██╗████╗  ██║    ║
    ║   █████╗  ██║██╔██╗ ██║███████║███████║██╔██╗ ██║    ║
    ║   ██╔══╝  ██║██║╚██╗██║██╔══██║██╔══██║██║╚██╗██║    ║
    ║   ██║     ██║██║ ╚████║██║  ██║██║  ██║██║ ╚████║    ║
    ║   ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝    ║
    ║                                                       ║
    ║${C.reset}${C.cyan}   Fingerprint Image Enhancement Engine                 ${C.bold}║
    ╚═══════════════════════════════════════════════════════╝${C.reset}
`;
    console.log(banner);
    console.log(`  ${C.gray}Version  : ${C.white}${C.bold}v${version}${C.reset}`);
    console.log(`  ${C.gray}Author   : ${C.white}Naseem Ansari${C.reset}`);
    console.log(`  ${C.gray}License  : ${C.white}ISC${C.reset}`);
    console.log(`  ${C.gray}Engine   : ${C.white}Gabor Filter (Python/OpenCV)${C.reset}`);
    console.log(`  ${C.gray}Runtime  : ${C.white}Node ${process.version}${C.reset}`);
    console.log();
}

// ── Log levels ──────────────────────────────────────────────────────
function info(msg) {
    console.log(`  ${C.blue}[INFO]${C.reset}  ${C.gray}${timestamp()}${C.reset}  ${msg}`);
}

function success(msg) {
    console.log(`  ${C.green}[  OK ]${C.reset}  ${C.gray}${timestamp()}${C.reset}  ${msg}`);
}

function warn(msg) {
    console.log(`  ${C.yellow}[WARN]${C.reset}  ${C.gray}${timestamp()}${C.reset}  ${msg}`);
}

function error(msg) {
    console.log(`  ${C.red}[FAIL]${C.reset}  ${C.gray}${timestamp()}${C.reset}  ${msg}`);
}

function debug(msg) {
    console.log(`  ${C.gray}[DBG ]  ${timestamp()}  ${msg}${C.reset}`);
}

// ── Section headers ─────────────────────────────────────────────────
function section(title) {
    console.log();
    console.log(`  ${C.cyan}${C.bold}▶ ${title}${C.reset}`);
    console.log(`  ${hrLine('─', 56)}`);
}

// ── Config table ────────────────────────────────────────────────────
function printConfig(config) {
    section('Configuration');
    const rows = [
        ['Input',      config.input],
        ['Output Dir', config.outputDir || '(auto)'],
        ['Format',     config.format || 'png'],
        ['Recursive',  config.recursive ? 'Yes' : 'No'],
        ['Flip',       config.flipOnly ? 'Only (no enhance)' : config.flip ? 'Yes (with enhance)' : 'No'],
        ['Resolution', config.res || 'Original'],
        ['Cleanup',    config.cleanup !== false ? 'Yes' : 'No'],
    ];
    for (const [key, val] of rows) {
        console.log(`  ${C.gray}  ${pad(key, 12)}${C.reset} : ${C.white}${val}${C.reset}`);
    }
}

// ── Progress bar (inline) ───────────────────────────────────────────
function progress(current, total, fileName) {
    const pct = Math.round((current / total) * 100);
    const barLen = 25;
    const filled = Math.round((current / total) * barLen);
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
    const counter = `[${current}/${total}]`;
    const short = path.basename(fileName);

    console.log(`  ${C.magenta}[PROC]${C.reset}  ${C.gray}${timestamp()}${C.reset}  ${C.cyan}${bar}${C.reset} ${C.bold}${pct}%${C.reset}  ${counter}  ${C.white}${short}${C.reset}`);
}

// ── Summary table ───────────────────────────────────────────────────
function printSummary(results, elapsedMs) {
    const total     = results.length;
    const successes = results.filter(r => r.status === 'success');
    const errors    = results.filter(r => r.status !== 'success');

    section('Summary');

    console.log(`  ${C.gray}  Total      ${C.reset} : ${C.bold}${total}${C.reset} image(s)`);
    console.log(`  ${C.green}  Succeeded  ${C.reset} : ${C.bold}${C.green}${successes.length}${C.reset}`);
    if (errors.length > 0) {
        console.log(`  ${C.red}  Failed     ${C.reset} : ${C.bold}${C.red}${errors.length}${C.reset}`);
    }
    console.log(`  ${C.gray}  Elapsed    ${C.reset} : ${C.bold}${formatMs(elapsedMs)}${C.reset}`);

    if (successes.length > 0) {
        console.log();
        console.log(`  ${C.green}${C.bold}  ✔ Output directory:${C.reset} ${C.white}${path.dirname(successes[0].output)}${C.reset}`);
    }

    if (errors.length > 0) {
        console.log();
        console.log(`  ${C.red}${C.bold}  ✘ Errors:${C.reset}`);
        for (const e of errors.slice(0, 5)) {
            console.log(`    ${C.red}→${C.reset} ${C.gray}${path.basename(e.input)}${C.reset}: ${e.error}`);
        }
        if (errors.length > 5) {
            console.log(`    ${C.gray}... and ${errors.length - 5} more${C.reset}`);
        }
    }
    console.log();
    console.log(`  ${hrLine('═', 56)}`);
    console.log();
}

module.exports = {
    C,
    printBanner,
    info,
    success,
    warn,
    error,
    debug,
    section,
    printConfig,
    progress,
    printSummary,
    formatBytes,
    formatMs,
    hrLine,
};
