const axios = require('axios');
const { Mistral } = require('@mistralai/mistralai');
const Course = require('../models/Course');
const TempUserCV = require('../models/TempUserCV');
const AIRecommendation = require('../models/AIRecommendation');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * Handle CV parsing using native libraries (PDF and DOCX)
 * Expects multipart/form-data with field name `cv`
 */
async function ocrCv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const filename = path.basename(filePath);
    const fileExt = path.extname(filename).toLowerCase();

    let text = '';
    let pages = [];

    try {
      if (fileExt === '.pdf') {
        // Parse PDF using pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
        
        // For PDFs, we'll treat the entire content as one page for now
        // pdf-parse doesn't provide page-by-page breakdown by default
        pages = [{
          pageNumber: 1,
          text: text,
          confidence: 100, // Native parsing is 100% accurate
          wordCount: text.split(/\s+/).length
        }];
      } else if (fileExt === '.docx' || fileExt === '.doc') {
        // Parse DOCX/DOC using mammoth
        const dataBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        text = result.value;
        
        pages = [{
          pageNumber: 1,
          text: text,
          confidence: 100, // Native parsing is 100% accurate
          wordCount: text.split(/\s+/).length
        }];
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Unsupported file format. Please upload a PDF, DOC, or DOCX file.' 
        });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No text extracted from document' 
        });
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      return res.json({ 
        success: true, 
        text: text,
        pages: pages,
        totalPages: pages.length,
        isMultiPage: pages.length > 1
      });

    } catch (parseError) {
      // Clean up the uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('Parse Error:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: `Failed to parse document: ${parseError.message}` 
      });
    }

  } catch (error) {
    console.error('CV Parse Error:', error);
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
      'You are an expert learning advisor. First, validate if the provided text is actually a CV by checking for CV-like content.',
      'If the text does NOT contain CV-like content (missing experience, education, skills, work history, etc.), respond with ONLY: "Sorry, this document does not appear to be a CV. Please upload a proper CV document."',
      'If it IS a CV, proceed to suggest courses based ONLY on the provided catalog (courseName + description).',
      'Output MUST be plain text, no JSON.',
      'Write two sections exactly in this order with headings:',
      'Related to Field:, then a bullet list of up to 5 items formatted as: - CourseName — brief reason referencing specific CV skills or experience',
      'Unrelated to Field:, then a bullet list of up to 5 items formatted as: - CourseName — brief reason explaining complementary value or breadth',
      'CRITICAL: Each section must contain DIFFERENT courses. Do NOT repeat any course name between the two sections.',
      'Related courses should directly relate to the CV holder\'s field, skills, or experience.',
      'Unrelated courses should be from completely different fields that would provide complementary knowledge or broaden their skill set.',
      'Each bullet MUST include a concise justification (one sentence).',
      'Do not invent any course names. Use only names from the catalog.',
      'Ensure you have at least 3-5 unique courses in each section without any duplicates.'
    ].join(' ');

    const userPrompt = `CV TEXT START\n${cvText}\nCV TEXT END\n\nCOURSE CATALOG (name and description):\n${JSON.stringify(catalog)}\n\nFirst, validate this is a CV. If not, respond with the error message. If it is a CV, return the two sections as specified. IMPORTANT: Each section must contain completely different courses - no duplicates between "Related to Field" and "Unrelated to Field". Ensure each bullet contains a short justification tied to the CV.`;

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

// ---------------------------
// Store CV text temporarily
// ---------------------------
async function storeTempCv(req, res) {
  try {
    const userId = req.userId;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    const upserted = await TempUserCV.findOneAndUpdate(
      { user: userId },
      { text, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: { id: upserted._id } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

// ---------------------------
// Suggest courses to add (explicit trigger from client)
// ---------------------------
async function suggestCoursesToAdd(req, res) {
  try {
    const userId = req.userId;
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'Mistral API key not configured' });

    // Get CV snapshot
    const temp = await TempUserCV.findOne({ user: userId });
    const cvText = temp?.text || '';
    if (!cvText) return res.json({ success: true, message: 'No CV stored' });

    // Build current catalog (names + description)
    const courses = await Course.find({}, 'title description').lean();
    const catalog = courses.map(c => ({ courseName: c.title, description: c.description || '' }));

    const client = new Mistral({ apiKey });
    const systemPrompt = [
      'You advise platform admins on new courses to add.',
      'First, validate if the provided text is actually a CV by checking for CV-like content.',
      'If the text does NOT contain CV-like content (missing experience, education, skills, work history, etc.), respond with ONLY: "Sorry, this document does not appear to be a CV. Please upload a proper CV document."',
      'If it IS a CV, proceed to suggest up to 5 NEW course names that are not in the current catalog but are logical additions for users like this CV holder.',
      'Output MUST be plain text with a bullet list of: - NewCourseName — brief reason. Do not exceed 5 items.'
    ].join(' ');

    const userPrompt = `CV TEXT START\n${cvText}\nCV TEXT END\n\nCURRENT CATALOG:\n${JSON.stringify(catalog.map(c => c.courseName))}\n\nFirst, validate this is a CV. If not, respond with the error message. If it is a CV, propose up to 5 NEW course names (not in the list) with brief reasons.`;

    const chatResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    });

    const suggestionsText = chatResponse?.choices?.[0]?.message?.content || '';

    // Extract proposed names heuristically (start of each bullet before dash)
    const names = (suggestionsText.match(/^\s*[-•]\s*(.+?)\s+—/gm) || [])
      .map(line => line.replace(/^\s*[-•]\s*/, '').split(' — ')[0])
      .slice(0, 5);

    const rec = new AIRecommendation({
      user: userId,
      fromCV: true,
      cvSnapshot: cvText.slice(0, 4000),
      suggestionsText,
      suggestedCourseNames: names
    });
    await rec.save();

    return res.json({ success: true, data: { id: rec._id } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

// ---------------------------
// Admin: list & delete recommendations
// ---------------------------
async function listCourseAddRecommendations(req, res) {
  try {
    const docs = await AIRecommendation.find({ type: 'courses_to_add', status: { $in: ['pending', 'actioned'] } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: docs });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

async function deleteCourseAddRecommendation(req, res) {
  try {
    const { id } = req.params;
    await AIRecommendation.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

module.exports.storeTempCv = storeTempCv;
module.exports.suggestCoursesToAdd = suggestCoursesToAdd;
module.exports.listCourseAddRecommendations = listCourseAddRecommendations;
module.exports.deleteCourseAddRecommendation = deleteCourseAddRecommendation;


