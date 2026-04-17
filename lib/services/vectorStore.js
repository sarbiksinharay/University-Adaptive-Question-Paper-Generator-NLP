/**
 * vectorStore.js - Local TF-IDF Vector Store with Cosine Similarity
 * 
 * Stores document chunks as TF-IDF vectors for fast retrieval.
 * Persisted to disk as JSON files in /local_storage/vector_db/
 * No external API calls needed - handles 7000+ files locally.
 */

const fs = require('fs');
const path = require('path');

const VECTOR_DB_PATH = path.join(process.cwd(), 'local_storage', 'vector_db');
const INDEX_FILE = path.join(VECTOR_DB_PATH, 'index.json');
const VOCAB_FILE = path.join(VECTOR_DB_PATH, 'vocabulary.json');
const CHUNKS_FILE = path.join(VECTOR_DB_PATH, 'chunks.json');

// ============================================================
// TF-IDF Vectorizer
// ============================================================

/**
 * Tokenize text into words (simple whitespace + punctuation split)
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2); // Skip very short words
}

/**
 * Compute term frequency for a document
 */
function computeTF(tokens) {
  const tf = {};
  const len = tokens.length;
  if (len === 0) return tf;
  
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  
  // Normalize by document length
  for (const term in tf) {
    tf[term] = tf[term] / len;
  }
  
  return tf;
}

/**
 * Compute IDF values from all documents
 */
function computeIDF(allDocTokens) {
  const idf = {};
  const N = allDocTokens.length;
  const docFreq = {};
  
  // Count how many documents contain each term
  for (const tokens of allDocTokens) {
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      docFreq[token] = (docFreq[token] || 0) + 1;
    }
  }
  
  // Compute IDF: log(N / df)
  for (const term in docFreq) {
    idf[term] = Math.log((N + 1) / (docFreq[term] + 1)) + 1; // Smoothed IDF
  }
  
  return idf;
}

/**
 * Compute TF-IDF vector using vocabulary
 */
function computeTFIDF(tokens, idf, vocab) {
  const tf = computeTF(tokens);
  const vector = {};
  
  for (const term in tf) {
    if (idf[term] !== undefined) {
      const score = tf[term] * idf[term];
      if (score > 0) {
        vector[term] = score; // Sparse representation
      }
    }
  }
  
  return vector;
}

/**
 * Cosine similarity between two sparse vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (const term in vecA) {
    normA += vecA[term] * vecA[term];
    if (vecB[term]) {
      dotProduct += vecA[term] * vecB[term];
    }
  }
  
  for (const term in vecB) {
    normB += vecB[term] * vecB[term];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================================
// Chunk Management
// ============================================================

/**
 * Split text into overlapping chunks
 * @param {string} text - Full document text
 * @param {number} chunkSize - Characters per chunk (default 500)
 * @param {number} overlap - Overlap characters (default 100)
 * @returns {string[]} - Array of text chunks
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  if (!text || text.length === 0) return chunks;
  
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) { // Skip tiny chunks
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }
  
  return chunks;
}

// ============================================================
// Vector Store Class
// ============================================================

class VectorStore {
  constructor() {
    this.chunks = [];      // { id, text, metadata, tokens }
    this.vocabulary = {};   // IDF values
    this.vectors = {};      // { id: sparse_vector }
    this.isBuilt = false;
    this._load();
  }
  
  /**
   * Load existing store from disk
   */
  _load() {
    try {
      if (fs.existsSync(CHUNKS_FILE) && fs.existsSync(VOCAB_FILE) && fs.existsSync(INDEX_FILE)) {
        this.chunks = JSON.parse(fs.readFileSync(CHUNKS_FILE, 'utf-8'));
        this.vocabulary = JSON.parse(fs.readFileSync(VOCAB_FILE, 'utf-8'));
        this.vectors = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        this.isBuilt = this.chunks.length > 0;
      }
    } catch (err) {
      console.error('[VectorStore] Error loading from disk:', err.message);
      this.chunks = [];
      this.vocabulary = {};
      this.vectors = {};
      this.isBuilt = false;
    }
  }
  
  /**
   * Save store to disk
   */
  _save() {
    try {
      if (!fs.existsSync(VECTOR_DB_PATH)) {
        fs.mkdirSync(VECTOR_DB_PATH, { recursive: true });
      }
      fs.writeFileSync(CHUNKS_FILE, JSON.stringify(this.chunks));
      fs.writeFileSync(VOCAB_FILE, JSON.stringify(this.vocabulary));
      fs.writeFileSync(INDEX_FILE, JSON.stringify(this.vectors));
    } catch (err) {
      console.error('[VectorStore] Error saving to disk:', err.message);
    }
  }
  
  /**
   * Add a document to the store (chunks it automatically)
   * @param {string} text - Document text
   * @param {object} metadata - Document metadata
   * @returns {number} - Number of chunks added
   */
  addDocument(text, metadata = {}) {
    const chunks = chunkText(text);
    let added = 0;
    
    for (const chunk of chunks) {
      const id = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tokens = tokenize(chunk);
      
      this.chunks.push({
        id,
        text: chunk,
        metadata,
        tokens,
      });
      added++;
    }
    
    this.isBuilt = false; // Need to rebuild vectors
    return added;
  }
  
  /**
   * Build/rebuild the TF-IDF index from all chunks
   * Call this after adding all documents
   */
  buildIndex() {
    if (this.chunks.length === 0) {
      console.log('[VectorStore] No chunks to index.');
      return;
    }
    
    console.log(`[VectorStore] Building index for ${this.chunks.length} chunks...`);
    
    // Compute IDF from all documents
    const allTokens = this.chunks.map(c => c.tokens);
    this.vocabulary = computeIDF(allTokens);
    
    // Compute TF-IDF vector for each chunk
    this.vectors = {};
    for (const chunk of this.chunks) {
      this.vectors[chunk.id] = computeTFIDF(chunk.tokens, this.vocabulary, this.vocabulary);
    }
    
    this.isBuilt = true;
    this._save();
    
    console.log(`[VectorStore] Index built. ${this.chunks.length} chunks, ${Object.keys(this.vocabulary).length} terms.`);
  }
  
  /**
   * Search for similar documents
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Array<{text: string, metadata: object, score: number}>}
   */
  search(query, topK = 5) {
    if (!this.isBuilt || this.chunks.length === 0) {
      return [];
    }
    
    const queryTokens = tokenize(query);
    const queryVector = computeTFIDF(queryTokens, this.vocabulary, this.vocabulary);
    
    // Compute similarity with all chunks
    const results = this.chunks.map(chunk => {
      const score = cosineSimilarity(queryVector, this.vectors[chunk.id] || {});
      return {
        id: chunk.id,
        text: chunk.text,
        metadata: chunk.metadata,
        score,
      };
    });
    
    // Sort by score descending and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).filter(r => r.score > 0);
  }
  
  /**
   * Get store statistics
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      totalTerms: Object.keys(this.vocabulary).length,
      isBuilt: this.isBuilt,
      storagePath: VECTOR_DB_PATH,
      sizeOnDisk: this._getDiskSize(),
    };
  }
  
  _getDiskSize() {
    try {
      let size = 0;
      const files = [INDEX_FILE, VOCAB_FILE, CHUNKS_FILE];
      for (const f of files) {
        if (fs.existsSync(f)) {
          size += fs.statSync(f).size;
        }
      }
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Clear the entire store
   */
  clear() {
    this.chunks = [];
    this.vocabulary = {};
    this.vectors = {};
    this.isBuilt = false;
    this._save();
  }
}

// Singleton instance
let storeInstance = null;

function getVectorStore() {
  if (!storeInstance) {
    storeInstance = new VectorStore();
  }
  return storeInstance;
}

module.exports = {
  getVectorStore,
  chunkText,
  VectorStore,
};
