const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const { ensureDir } = require('./fileHandler');

/**
 * Execute jobs via the Python runner
 * @param {Array} jobs - Array of job objects: { input, output, flip_only, flip }
 * @param {Function} [onProgress] - Optional callback for progress updates
 */
async function executePythonRunner(jobs, onProgress) {
    if (jobs.length === 0) return [];

    const tempDir = path.join(process.cwd(), 'temp');
    await ensureDir(tempDir);
    
    // Create temporary JSON file with jobs
    const payloadFileName = `payload_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`;
    const payloadPath = path.join(tempDir, payloadFileName);
    
    await fs.writeFile(payloadPath, JSON.stringify(jobs));

    const runnerScript = path.join(__dirname, '..', 'python', 'runner.py');
    let pythonCmd = 'python';

    // To gracefully fallback if 'python' isn't available, we could check 'python3', but let's assume 'python' is mapped correctly
    return new Promise((resolve, reject) => {
        const pyProcess = spawn(pythonCmd, [runnerScript, payloadPath]);

        let stdoutData = '';
        let stderrData = '';

        const rl = readline.createInterface({
            input: pyProcess.stdout,
            terminal: false
        });

        rl.on('line', (line) => {
            if (line.startsWith('___FINHANCE_PROGRESS___=')) {
                if (onProgress) {
                    try {
                        const progStr = line.substring('___FINHANCE_PROGRESS___='.length).trim();
                        const prog = JSON.parse(progStr);
                        onProgress(prog);
                    } catch(e) {}
                }
            } else {
                stdoutData += line + '\n';
            }
        });

        pyProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pyProcess.on('close', async (code) => {
            // Cleanup the payload file
            try {
                await fs.unlink(payloadPath);
            } catch (err) {
                // Ignore cleanup error
            }

            if (code !== 0) {
                return reject(new Error(`Python runner exited with code ${code}\\nStderr: ${stderrData}\\nStdout: ${stdoutData}`));
            }

            try {
                // Find the distinct JSON tag we inject from python
                const marker = "___FINHANCE_OUTPUT___=";
                const markerIndex = stdoutData.lastIndexOf(marker);
                
                if (markerIndex === -1) {
                    throw new Error("Could not find result JSON marker.");
                }
                
                const jsonStr = stdoutData.substring(markerIndex + marker.length).trim();
                const result = JSON.parse(jsonStr);
                if (result.error) {
                    return reject(new Error(result.error));
                }
                
                resolve(result.results || []);
            } catch (err) {
                reject(new Error(`Failed to parse python runner output: ${err.message}\\nStdout: ${stdoutData}`));
            }
        });
        
        pyProcess.on('error', (err) => {
            reject(new Error(`Failed to start python process. Make sure python is installed and accessible. Error: ${err.message}`));
        });
    });
}

module.exports = {
    executePythonRunner
};
