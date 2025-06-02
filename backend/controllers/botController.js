const express = require('express');
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = ['TOKEN', 'ENDPOINT', 'MODEL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log(process.env);
  console.log(missingEnvVars);
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const token = process.env.TOKEN;
const endpoint = process.env.ENDPOINT;
const model = process.env.MODEL;
console.log("token",token);
console.log("endpoint",endpoint);
console.log("model",model);


// Initialize the client
const client = ModelClient(
  endpoint,
  new AzureKeyCredential(token),
);

// Route for chat completions
const sendMessage = async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: messages,
        temperature: 1,
        top_p: 1,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    res.json({
      response: response.body.choices[0].message.content
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
};

module.exports = { sendMessage };

