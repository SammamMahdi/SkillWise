const axios = require('axios');

/**
 * Handle CV OCR using OCR.space
 * Expects multipart/form-data with field name `cv`
 */
async function ocrCv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'OCR API key not configured' });
    }

    const formData = new (require('form-data'))();
    const fs = require('fs');
    const path = require('path');

    const filePath = req.file.path;
    const filename = path.basename(filePath);
    const fileExt = path.extname(filename).toLowerCase();

    formData.append('apikey', apiKey);
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');
    formData.append('language', 'eng');
    
    // For PDFs, enable multi-page processing
    if (fileExt === '.pdf') {
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', 'PDF');
    }
    
    formData.append('file', fs.createReadStream(filePath), filename);

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000, // Increased timeout for multi-page PDFs
    });

    const data = response.data;
    if (!data || data.OCRExitCode !== 1) {
      const message = data?.ErrorMessage || data?.ErrorDetails || 'OCR failed';
      return res.status(400).json({ success: false, message });
    }

    // Process results - handle both single and multi-page
    const parsedResults = data.ParsedResults || [];
    
    if (parsedResults.length === 0) {
      return res.status(400).json({ success: false, message: 'No text extracted from document' });
    }

    // For multi-page documents, return structured page data
    if (parsedResults.length > 1) {
      const pages = parsedResults.map((result, index) => ({
        pageNumber: index + 1,
        text: result.ParsedText || '',
        confidence: result.TextOverlay?.Lines?.[0]?.Words?.[0]?.Confidence || 0,
        wordCount: result.TextOverlay?.Lines?.reduce((count, line) => count + (line.Words?.length || 0), 0) || 0
      }));

      return res.json({ 
        success: true, 
        text: pages.map(p => p.text).join('\n\n--- PAGE BREAK ---\n\n'),
        pages: pages,
        totalPages: pages.length,
        isMultiPage: true
      });
    } else {
      // Single page document
      const text = parsedResults[0].ParsedText || '';
      return res.json({ 
        success: true, 
        text: text,
        pages: [{
          pageNumber: 1,
          text: text,
          confidence: parsedResults[0].TextOverlay?.Lines?.[0]?.Words?.[0]?.Confidence || 0,
          wordCount: parsedResults[0].TextOverlay?.Lines?.reduce((count, line) => count + (line.Words?.length || 0), 0) || 0
        }],
        totalPages: 1,
        isMultiPage: false
      });
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { ocrCv };


