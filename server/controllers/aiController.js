const axios = require('axios');
const { Mistral } = require('@mistralai/mistralai');
const Course = require('../models/Course');

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

// ---------------------------
// Mistral: Recommend Courses
// ---------------------------
async function recommendCourses(req, res) {
  try {
    const { userSkills } = req.body;
    if (!Array.isArray(userSkills) || userSkills.length === 0) {
      return res.status(400).json({ success: false, message: 'userSkills must be a non-empty array of strings' });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Mistral API key not configured' });
    }

    // Only fetch course names (titles) from DB
    const courses = await Course.find({}, 'title').lean();
    const courseNames = courses.map(c => c.title).filter(Boolean);

    // Guard if no courses
    if (courseNames.length === 0) {
      return res.status(200).json({ success: true, skills_detected: userSkills, recommended_courses: [] });
    }

    const client = new Mistral({ apiKey });

    const systemPrompt = [
      'You are an expert career advisor. You MUST return ONLY valid JSON. No prose.',
      'Use strictly this JSON schema: {"skills_detected": string[], "recommended_courses": {"courseName": string, "reason": string}[]}.',
      'Only use the provided list of course names. Do not invent new courses.',
      'Pick up to 5 courses that best match the user skills and give concise reasons.'
    ].join(' ');

    const userPrompt = `User skills: ${JSON.stringify(userSkills)}\nAvailable course names: ${JSON.stringify(courseNames)}\nReturn ONLY JSON.`;

    const chatResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const raw = chatResponse?.choices?.[0]?.message?.content || '';

    // Best-effort JSON parsing
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/\{[\s\S]*\}$/);
      result = match ? JSON.parse(match[0]) : { skills_detected: userSkills, recommended_courses: [] };
    }

    // Validate minimal structure
    const skillsDetected = Array.isArray(result.skills_detected) ? result.skills_detected : userSkills;
    const recommended = Array.isArray(result.recommended_courses) ? result.recommended_courses : [];

    // Filter out any courses not in our list
    const safeRecommended = recommended
      .filter(r => r && typeof r.courseName === 'string' && courseNames.includes(r.courseName))
      .slice(0, 5)
      .map(r => ({ courseName: r.courseName, reason: r.reason || 'Relevant to your skills' }));

    return res.json({ success: true, skills_detected: skillsDetected, recommended_courses: safeRecommended });
  } catch (error) {
    console.error('Mistral recommend error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { ocrCv, recommendCourses };

// ---------------------------------------
// Mistral: Recommend using raw CV text
// ---------------------------------------
async function recommendCoursesFromText(req, res) {
  try {
    const cvText = (req.body?.text || req.body?.cvText || '').toString();
    if (!cvText || cvText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'text (CV content) is required' });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Mistral API key not configured' });
    }

    // Fetch course names and descriptions (only these fields!)
    const courses = await Course.find({}, 'title description price tags publicCode teacher lectures').populate('teacher', 'name').lean();
    if (!courses || courses.length === 0) {
      return res.json({ success: true, suggestionsText: 'No courses available in the catalog.', matchedCourseNames: [], courses: [] });
    }

    const catalog = courses.map(c => ({ courseName: c.title, description: c.description || '' }));

    const client = new Mistral({ apiKey });

    const systemPrompt = [
      'You are an expert learning advisor. Read the CV text and suggest courses based ONLY on the provided catalog (courseName + description).',
      'Output MUST be plain text, no JSON.',
      'Write two sections exactly in this order with headings:',
      'Related to Field:, then a bullet list of up to 5 items formatted as: - CourseName — brief reason referencing specific CV skills or experience',
      'Unrelated to Field:, then a bullet list of up to 5 items formatted as: - CourseName — brief reason explaining complementary value or breadth',
      'Each bullet MUST include a concise justification (one sentence).',
      'Do not invent any course names. Use only names from the catalog.'
    ].join(' ');

    const userPrompt = `CV TEXT START\n${cvText}\nCV TEXT END\n\nCOURSE CATALOG (name and description):\n${JSON.stringify(catalog)}\n\nReturn the two sections as specified, ensuring each bullet contains a short justification tied to the CV.`;

    const chatResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    });

    const suggestionsText = chatResponse?.choices?.[0]?.message?.content || 'No suggestions generated.';

    // Try to extract which course names were mentioned in the suggestions
    const names = catalog.map(c => c.courseName);
    const matchedCourseNames = names.filter(n => suggestionsText.includes(n)).slice(0, 10);

    let matchedCourses = [];
    if (matchedCourseNames.length > 0) {
      matchedCourses = await Course.find(
        { title: { $in: matchedCourseNames } },
        'title description price tags publicCode teacher lectures'
      ).populate('teacher', 'name').lean();
    }

    return res.json({ success: true, suggestionsText, matchedCourseNames, courses: matchedCourses });
  } catch (error) {
    console.error('Mistral recommend-from-text error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports.recommendCoursesFromText = recommendCoursesFromText;


