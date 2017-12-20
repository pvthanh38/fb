var https = require('https')
var pem = require('pem')
var express = require('express')

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  var app = express()

  app.get('/', function (req, res) {
	console.log(req.param('hub.challenge'));
	res.send(req.param('hub.challenge'))
    res.send('o hai!')
  })

  https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(443)
})