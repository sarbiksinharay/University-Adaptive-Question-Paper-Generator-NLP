/**
 * llmBridge.js - Bridge between Node.js and Python LLM service
 * 
 * Calls the Python script (llm_generate.py) which uses
 * emergentintegrations for LLM API calls.
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(process.cwd(), 'lib', 'llm_generate.py');
const PYTHON_BIN = '/root/.venv/bin/python3';

/**
 * Call the LLM via Python bridge
 * @param {string} systemPrompt - System message for the LLM
 * @param {string} userPrompt - User message / query
 * @param {object} options - Optional: { model, provider }
 * @returns {Promise<string>} - LLM response text
 */
async function callLLM(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.EMERGENT_LLM_KEY;
  
  if (!apiKey) {
    throw new Error('EMERGENT_LLM_KEY not found in environment variables');
  }
  
  const inputData = {
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    api_key: apiKey,
    model: options.model || 'gpt-4.1-mini',
    provider: options.provider || 'openai',
  };
  
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_BIN, [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('[LLM Bridge] stderr:', stderr);
        try {
          const parsed = JSON.parse(stdout);
          reject(new Error(parsed.error || 'LLM call failed'));
        } catch {
          reject(new Error(`LLM process exited with code ${code}: ${stderr || stdout}`));
        }
        return;
      }
      
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.error) {
          reject(new Error(parsed.error));
        } else {
          resolve(parsed.response);
        }
      } catch (err) {
        reject(new Error(`Failed to parse LLM response: ${err.message}`));
      }
    });
    
    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
    
    // Send input data via stdin
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
    
    // Timeout after 60 seconds
    setTimeout(() => {
      python.kill();
      reject(new Error('LLM call timed out after 60 seconds'));
    }, 60000);
  });
}

module.exports = { callLLM };
