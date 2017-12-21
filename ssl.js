// filename: app.js
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
// Set up express server here
const options = {
    cert: fs.readFileSync('/etc/letsencrypt/live/lab.letweb.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/lab.letweb.net/privkey.pem')
};
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})
app.listen(8080);
https.createServer(options, app).listen(8443);