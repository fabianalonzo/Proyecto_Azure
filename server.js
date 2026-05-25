require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
    res.json({
        visionKey: process.env.AZURE_VISION_KEY,
        visionEndpoint: process.env.AZURE_VISION_ENDPOINT,
        languageKey: process.env.AZURE_LANGUAGE_KEY,
        languageEndpoint: process.env.AZURE_LANGUAGE_ENDPOINT,
        chatEndpoint: process.env.AZURE_CHAT_ENDPOINT,
        chatsuscriptionKey: process.env.AZURE_CHAT_KEY,
        azure_Endpoint: process.env.AZURE_ENDPOINT_CHAT,
        deployment_name: process.env.DEPLOYMENT_NAME_CHAT,
        api_version: process.env.API_VERSION_CHAT


    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});