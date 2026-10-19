const { ai, MODEL} = require('./gemini');

async function main() {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents:"Give me a list of activity ideas based on my current location"
    });
    console.log(response.text);
}
main();