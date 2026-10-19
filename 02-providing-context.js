const { ai, MODEL} = require('./gemini');
const {getCurrentLocation, getCurrentWeather} = require('./tools');
async function main() {

    const location = await getCurrentLocation();
    const weather = await getCurrentWeather();

    const response = await ai.models.generateContent({
        model: MODEL,
        contents:`Give me a list of activity ideas based on my current location.
            Location: ${location}, Weather: ${JSON.stringify(weather)}
        `
    });
    console.log(response.text);
}
main();