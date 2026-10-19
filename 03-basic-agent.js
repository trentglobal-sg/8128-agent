const { ai, MODEL } = require('./gemini');
const { getCurrentLocation, getCurrentWeather } = require('./tools');

// const schema = {
//     type: "array",
//     items: {
//         type: "object",
//         properties: {
//             "type": {
//                 "type": "string",
//                 "enum": ["thought", "action", "result"]
//             },
//             "content": { type: "string" },
//             "function": { type: "string" },
//             "parameters": {
//                 "type": "array",
//                 "items": { "type": "string" }
//             }
//         }
//  required: ["type"]
//     },
//    

// }

const schema = {
    type: "array",
    items: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["thought", "action", "result"]
            },
            content: { type: "string" },
            function: { type: "string" },
            parameters: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: ["type"]
    }
}
// createMessage will format a message according to Gemini specifications
// for chat hisotry
// role will be user if human, model if the LLM
function createMessage(role, content) {
    return {
        role,
        parts: [
            {
                text: content
            }
        ]
    }
}

async function startAgent(query) {
    // chat history
    const messages = [
        createMessage("user", query)
    ];
    const response = await agentLoop(messages);
}

/**
 * 
 * @param {*} messages Chat history
 */
async function agentLoop(messages, maxIterations = 10) {
    for (let iterations = 0; iterations < maxIterations; iterations++) {
        console.log(`-- Iterations: ${iterations} --`);

        const reactAgentPrompt = `
        You must return an array of responses. Each response has a type field: 'thought', 'action', 'result'
        - if type is "thought": include a 'content' field with your thinking as a string
        - if type is "action": include a 'function' field with the function name and parameters to call
        - if type is "result": include a "content" field with the final answer as a string

        You can cycle through thought, action and observation. At the end of the loop you will output a final result
        Wait for the client to provide the result of a function call before moving on to the next thought

        Available actions:
        - getCurrentWeather
          Returns the current weather and PSI rating of the location specificed
          Parameters: [location]
        - getLocation:
          Returns the user's location details. No arguments needed
          Parameters: []

          You must return a JSON array of objects
    `

        const response = await ai.models.generateContent({
            model: MODEL,
            config: {
                systemInstruction: reactAgentPrompt,
                responseMimeType: "application/json",
                responseSchema: schema
            },
            contents: messages

        });

        // convert the JSON response into an actual JSON object
        const responses = JSON.parse(response.text);
        console.log(responses);
        for (let r of responses) {
            if (r.type === "result") {
                console.log("Final ans:", r.content)
                return r.content;
            }

            // if the agent requests a function call (aka action), check what function is
            // requested and call it
            if (r.type === "action") {

                // dispatch
                let observation = null;
                if (r.function === "getLocation") {
                    observation = await getCurrentLocation();
                }

                else if (r.function === "getCurrentWeather") {
                    observation = await getCurrentWeather(r.parameters[0]);
                } else {
                    observation = "Agent used a tool that doesn't exist";
                }

                console.log("observation =", observation);
                messages.push(createMessage("model", response.text));
                messages.push(createMessage("user", `Observation: ${JSON.stringify(observation)}`))
            }
        }
    }
    return "The agent reached the maximum number of iterations without a final answer";
}
async function main() {

    const response = await startAgent("Give me some idea for outdoor activities");
    console.log(response);

}
main();