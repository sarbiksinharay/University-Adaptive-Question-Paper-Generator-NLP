/**
 * queue.js - Processing queue for batch document ingestion
 * 
 * Handles sequential processing of 7000+ files without
 * running out of memory. Processes one file at a time
 * with configurable delays between batches.
 */

const { extractText } = require('./extractor');
const { getVectorStore } = require('./vectorStore');

// ============================================================
// Queue State (in-memory, singleton)
// ============================================================
let queueState = {
  status: 'idle',          // idle | processing | completed | error
  totalFiles: 0,
  processedFiles: 0,
  failedFiles: 0,
  currentFile: '',
  errors: [],
  startedAt: null,
  completedAt: null,
  chunksAdded: 0,
};

/**
 * Reset queue state for a new run
 */
function resetQueue(totalFiles) {
  queueState = {
    status: 'processing',
    totalFiles,
    processedFiles: 0,
    failedFiles: 0,
    currentFile: '',
    errors: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    chunksAdded: 0,
  };
}

/**
 * Get current queue status
 */
function getQueueStatus() {
  const store = getVectorStore();
  return {
    ...queueState,
    progress: queueState.totalFiles > 0
      ? Math.round((queueState.processedFiles / queueState.totalFiles) * 100)
      : 0,
    vectorStore: store.getStats(),
  };
}

/**
 * Process a single file: extract text, chunk, and add to vector store
 */
async function processFile(filePath) {
  const store = getVectorStore();
  
  try {
    queueState.currentFile = filePath;
    
    // Extract text from file
    const result = await extractText(filePath);
    
    if (!result.text || result.text.trim().length < 10) {
      queueState.failedFiles++;
      queueState.errors.push({
        file: filePath,
        error: 'No meaningful text extracted',
      });
      return 0;
    }
    
    // Add document to vector store (auto-chunks)
    const chunksAdded = store.addDocument(result.text, {
      ...result.metadata,
      sourcePath: filePath,
      extractedAt: new Date().toISOString(),
    });
    
    queueState.processedFiles++;
    queueState.chunksAdded += chunksAdded;
    
    return chunksAdded;
    
  } catch (err) {
    queueState.failedFiles++;
    queueState.errors.push({
      file: filePath,
      error: err.message,
    });
    return 0;
  }
}

/**
 * Process files sequentially with delay between batches
 * @param {string[]} filePaths - Array of file paths to process
 * @param {number} batchSize - Files to process before pausing (default 10)
 * @param {number} delayMs - Delay between batches in ms (default 100)
 */
async function processFiles(filePaths, batchSize = 10, delayMs = 100) {
  resetQueue(filePaths.length);
  
  console.log(`[Queue] Starting processing of ${filePaths.length} files...`);
  
  try {
    for (let i = 0; i < filePaths.length; i++) {
      await processFile(filePaths[i]);
      
      // Add delay between batches to prevent memory pressure
      if ((i + 1) % batchSize === 0) {
        console.log(`[Queue] Processed ${i + 1}/${filePaths.length} files...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Force garbage collection hint
        if (global.gc) global.gc();
      }
    }
    
    // Build the TF-IDF index after all documents are added
    console.log('[Queue] Building vector index...');
    const store = getVectorStore();
    store.buildIndex();
    
    queueState.status = 'completed';
    queueState.completedAt = new Date().toISOString();
    queueState.currentFile = '';
    
    console.log(`[Queue] Completed! ${queueState.processedFiles} files processed, ${queueState.chunksAdded} chunks created.`);
    
  } catch (err) {
    queueState.status = 'error';
    queueState.errors.push({ file: 'queue', error: err.message });
    console.error('[Queue] Fatal error:', err.message);
  }
}

module.exports = {
  processFiles,
  processFile,
  getQueueStatus,
  resetQueue,
};
