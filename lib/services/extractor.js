/**
 * extractor.js - Modular text extraction service
 * Handles PDF, DOCX, CSV, and PNG files
 * Routes each file type to the correct extraction pipeline
 */

const fs = require('fs');
const path = require('path');

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.csv', '.png', '.jpg', '.jpeg'];

/**
 * Extract text from a PDF file
 * Uses pdf-parse for text-based PDFs
 */
async function extractPDF(filePath) {
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  // If text is too short, it might be a scanned/image PDF
  if (data.text && data.text.trim().length > 50) {
    return {
      text: data.text.trim(),
      metadata: {
        pages: data.numpages,
        type: 'pdf-text',
        file: path.basename(filePath),
      },
    };
  }
  
  // Fallback: minimal text found, likely scanned
  return {
    text: data.text ? data.text.trim() : '',
    metadata: {
      pages: data.numpages,
      type: 'pdf-scanned',
      file: path.basename(filePath),
      warning: 'Low text content - may be a scanned PDF. Consider OCR.',
    },
  };
}

/**
 * Extract text from a DOCX file
 * Uses mammoth for DOCX conversion
 */
async function extractDOCX(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  
  return {
    text: result.value.trim(),
    metadata: {
      type: 'docx',
      file: path.basename(filePath),
      warnings: result.messages.length > 0 ? result.messages.map(m => m.message) : [],
    },
  };
}

/**
 * Extract text from a CSV file
 * Uses papaparse for CSV parsing
 */
async function extractCSV(filePath) {
  const Papa = require('papaparse');
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  
  // Convert CSV rows to readable text
  const headers = parsed.meta.fields || [];
  const rows = parsed.data || [];
  
  let textParts = [];
  textParts.push('Headers: ' + headers.join(', '));
  
  rows.forEach((row, idx) => {
    const rowText = headers.map(h => `${h}: ${row[h] || ''}`).join(', ');
    textParts.push(`Row ${idx + 1}: ${rowText}`);
  });
  
  return {
    text: textParts.join('\n'),
    metadata: {
      type: 'csv',
      file: path.basename(filePath),
      rows: rows.length,
      columns: headers.length,
    },
  };
}

/**
 * Extract text from an image using OCR (tesseract.js)
 * Works for PNG, JPG, JPEG files and scanned documents
 */
async function extractImageOCR(filePath) {
  try {
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: () => {},  // Suppress verbose logging
    });
    
    return {
      text: text.trim(),
      metadata: {
        type: 'ocr-image',
        file: path.basename(filePath),
      },
    };
  } catch (err) {
    return {
      text: '',
      metadata: {
        type: 'ocr-image',
        file: path.basename(filePath),
        error: 'OCR failed: ' + err.message,
      },
    };
  }
}

/**
 * Main extraction function - routes to correct extractor by file type
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<{text: string, metadata: object}>}
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  switch (ext) {
    case '.pdf':
      return extractPDF(filePath);
    case '.docx':
      return extractDOCX(filePath);
    case '.csv':
      return extractCSV(filePath);
    case '.png':
    case '.jpg':
    case '.jpeg':
      return extractImageOCR(filePath);
    default:
      throw new Error(`No extractor for: ${ext}`);
  }
}

/**
 * Scan a directory recursively for supported files
 * @param {string} dirPath - Directory path to scan
 * @returns {string[]} - Array of file paths
 */
function scanDirectory(dirPath) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

module.exports = {
  extractText,
  scanDirectory,
  SUPPORTED_EXTENSIONS,
};
