const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Environment
const dotenv = require('dotenv');
dotenv.config();

// Support post requests - json 
app.use(bodyParser.json());

// Google app engine 
app.set('trust proxy', true);

// Server
const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log(`ML solution listening at ${port} port`);
});

// Test endpoint
app.get('/', (req, res) => {
    res.status(200).send('Desafio - Operación fuego de Quasar.');
});

// Routes
const routes = require('./routes/routes');
app.use('/api', routes);

// Catch 404 error
app.use((req, res) => {
    res.status(404).json({
        error: `page ${req.originalUrl} not found`,
        status: 404
    });
});

module.exports = app;