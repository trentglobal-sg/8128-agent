const { ai, MODEL } = require("./gemini");

/**
 * SOLUTION: Array Operations Agent
 * 
 * This is the complete solution for the array operations agent exercise.
 * Students should attempt ex-01.js first before looking at this solution.
 */

// Array operation functions
const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);
const count = (arr) => arr.length;
const average = (arr) => arr.length > 0 ? sum(arr) / count(arr) : 0;
const findMin = (arr) => arr.length > 0 ? Math.min(...arr) : null;
const findMax = (arr) => arr.length > 0 ? Math.max(...arr) : null;
const getElement = (arr, index) => arr[index];
const sort = (arr) => [...arr].sort((a, b) => a - b);
const sumOfSquares = (arr) => arr.reduce((acc, val) => acc + val * val, 0);

// Math operation functions
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => b !== 0 ? a / b : null;
const power = (a, b) => Math.pow(a, b);
const sqrt = (a) => a >= 0 ? Math.sqrt(a) : null;

// Sample data
const testData = [23, 45, 12, 67, 34, 89, 15, 56, 78, 90];

const arrayAgentPrompt = `
You must return an array of responses. Each response has a "type" field which can be "thought", "action", or "result".

- If type is "thought": include a "content" field with your thinking as a string
- If type is "action": include a "function" field with the function name and "parameters" field with an array of parameters
- If type is "result": include a "content" field with the final answer as a string

You cycle through Thought, Action, Observation. At the end of the loop you output a final result.

IMPORTANT: You MUST use the available tools for ALL calculations. NEVER perform arithmetic in your thoughts.
For example, to calculate 10 + 5, you must call add(10, 5). To calculate sqrt(100), you must call sqrt(100).
Do NOT estimate or calculate values yourself - always use the provided functions.

Available actions:
Array operations:
- sum: Returns the sum of all numbers. Parameters: [array]
- count: Returns the count of elements. Parameters: [array]
- average: Returns the mean/average. Parameters: [array]
- findMin: Returns the minimum value. Parameters: [array]
- findMax: Returns the maximum value. Parameters: [array]
- getElement: Returns the element at the specified index. Parameters: [array, index]
- sort: Returns a sorted copy of the array. Parameters: [array]
- sumOfSquares: Returns the sum of squared values (x1^2 + x2^2 + ... + xn^2). Parameters: [array]

Math operations:
- add: Returns a + b. Parameters: [a, b]
- subtract: Returns a - b. Parameters: [a, b]
- multiply: Returns a * b. Parameters: [a, b]
- divide: Returns a / b. Parameters: [a, b]
- power: Returns a^b. Parameters: [a, b]
- sqrt: Returns square root of a. Parameters: [a]

Efficiency tip: For variance calculation, use the computational formula:
Variance = (sumOfSquares / count) - (average^2)
This is much more efficient than calculating each squared difference individually.

Example session:
Question: What is the average and range of values in the array [10, 20, 30]?

You return:
[
  { "type": "thought", "content": "I need to calculate the average and find the range (min to max)." },
  { "type": "action", "function": "average", "parameters": [[10, 20, 30]] }
]

You will be called again with observation, then you continue:
[
  { "type": "thought", "content": "The average is 20. Now I need to find the minimum and maximum values." },
  { "type": "action", "function": "findMin", "parameters": [[10, 20, 30]] }
]

After receiving more observations, you output the final result:
[
  { "type": "result", "content": "The average is 20, and the range is from 10 to 30." }
]
`;

const createMessage = (role, content) => ({
    role,
    parts: [{ text: content }]
});

async function main() {
    console.log("Test Data:", testData);
    console.log("\n");
    
    // Test queries - uncomment to test different scenarios
    // await startAgent(`What is the sum and average of the array ${JSON.stringify(testData)}?`);
    // await startAgent(`Calculate the variance of ${JSON.stringify(testData)}`);
    await startAgent(`Calculate the standard deviation of ${JSON.stringify(testData)}`);
    // await startAgent(`Find the median of ${JSON.stringify(testData)}`);
    // await startAgent(`Calculate the interquartile range (IQR) of ${JSON.stringify(testData)}`);
    // await startAgent(`Give me complete statistics (count, sum, average, min, max, range, variance, std dev, median) for ${JSON.stringify(testData)}`);
}

async function startAgent(query) {
    console.log("Query:", query);
    const messages = [createMessage("user", query)];
    
    const response = await agentLoop(messages);
    console.log("\n[Final Answer]:", response);
    console.log("\n" + "=".repeat(80) + "\n");
}

async function agentLoop(messages, maxIterations = 20) {
    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;
        console.log(`\n--- Iteration ${iterations} ---`);

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: messages,
            config: {
                systemInstruction: arrayAgentPrompt,
                responseMimeType: "application/json",
                responseSchema: {
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
                                items: {}
                            }
                        },
                        required: ["type"]
                    }
                }
            }
        });

        const responses = JSON.parse(response.text);
        console.log(JSON.stringify(responses, null, 2));

        // Check if we have a final result
        const hasResult = responses.some(r => r.type === "result");
        if (hasResult) {
            const result = responses.find(r => r.type === "result");
            return result.content;
        }

        // Execute any actions
        const action = responses.find(r => r.type === "action");
        if (action) {
            let observation;
            const funcName = action.function;
            const params = action.parameters;

            // Array operations
            if (funcName === "sum") {
                observation = sum(params[0]);
            } else if (funcName === "count") {
                observation = count(params[0]);
            } else if (funcName === "average") {
                observation = average(params[0]);
            } else if (funcName === "findMin") {
                observation = findMin(params[0]);
            } else if (funcName === "findMax") {
                observation = findMax(params[0]);
            } else if (funcName === "getElement") {
                observation = getElement(params[0], params[1]);
            } else if (funcName === "sort") {
                observation = sort(params[0]);
            } else if (funcName === "sumOfSquares") {
                observation = sumOfSquares(params[0]);
            }
            // Math operations
            else if (funcName === "add") {
                observation = add(params[0], params[1]);
            } else if (funcName === "subtract") {
                observation = subtract(params[0], params[1]);
            } else if (funcName === "multiply") {
                observation = multiply(params[0], params[1]);
            } else if (funcName === "divide") {
                observation = divide(params[0], params[1]);
            } else if (funcName === "power") {
                observation = power(params[0], params[1]);
            } else if (funcName === "sqrt") {
                observation = sqrt(params[0]);
            } else {
                observation = `Unknown function: ${funcName}`;
            }

            console.log(`\nObservation: ${JSON.stringify(observation)}`);

            // Add observation to messages
            messages.push(createMessage("model", response.text));
            messages.push(createMessage("user", `Observation: ${JSON.stringify(observation)}`));
        } else {
            // No action and no result, something went wrong
            return "Agent did not provide an action or result.";
        }
    }

    return "Max iterations reached without a final result.";
}

main();