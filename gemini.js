require('dotenv').config();
const { GoogleGenAI} = require('@google/genai');

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

// for other JS files to access MODEL and ai, we have to export them
module.exports = {
    ai,
    MODEL
}