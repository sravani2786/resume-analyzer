require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateWithRetry(model, prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isOverloaded = error.status === 503;
      if (isOverloaded && i < retries - 1) {
        console.log(`Model overloaded, retrying... (attempt ${i + 2}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
}

app.post("/analyze", upload.single("resume"), async (req, res) => {
  console.log("ANALYZE REQUEST RECEIVED");
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume.",
      });
    }

    // Step 1: Extract text from PDF
    const fileData = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileData);
    const resumeText = pdfData.text;

    fs.unlinkSync(req.file.path);

    // Step 2: Send resume text to Gemini AI for analysis
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
You are an expert resume reviewer and ATS (Applicant Tracking System) analyzer.
Analyze the following resume text and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:

{
  "atsScore": <number 0-100>,
  "detectedSkills": [<list of skills found>],
  "missingSkills": [<list of commonly expected skills that are missing>],
  "strengths": [<list of strengths>],
  "weaknesses": [<list of weaknesses>],
  "suggestions": [<list of improvement suggestions>],
  "suitableRoles": [<list of job roles this resume fits>]
}

Resume text:
${resumeText}
`;

    const result = await generateWithRetry(model, prompt);
    let aiText = result.response.text();

    // Clean up response (remove markdown code fences if present)
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(aiText);
    } catch (parseError) {
      console.log("AI JSON PARSE ERROR:", parseError);
      console.log("RAW AI RESPONSE:", aiText);
      return res.status(500).json({
        success: false,
        message: "AI response could not be parsed.",
      });
    }

    // Step 3: Send everything back to frontend
    res.json({
      success: true,
      message: "Resume analyzed successfully!",
      fileName: req.file.originalname,
      text: resumeText,
      analysis: analysis,
    });
  } catch (error) {
    console.log("ANALYZE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Could not analyze the resume.",
    });
  }
});

app.listen(5000, () => {
  console.log("Backend server running on http://localhost:5000");
});