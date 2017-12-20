var express = require('express');
var app = require('express')();

var http = require('http').Server(app);
var https = require('https');
var pem = require('pem')
var io = require('socket.io')(http);
const request = require('request-promise');
var api = require('request');

var port = process.env.PORT || 3000;

/*var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))*/

var rawBodyParser = require('raw-body-parser');
app.use(rawBodyParser());


var token = 'EAAEfHG6gfw4BALB9Ba0lhIPco2xZBCBGWKhJdf0IAZAyyozsMYJDVe6yPB6RN5Xtb2MgZB710SIai8k9kLsZAZAkoPlOzhLzoiOgxW58ekQFwagG8ZCmb0H9Lgq0ahyuZCpZCATa1RvD8fVCMZBMlLG9nujLRJM5vBdvErHwkeZBKUFAZDZD';	
var conv = "";
pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  //var app = express()
	app.get('/', function(req, res){
	  res.sendFile(__dirname + '/index.html');
	});
	app.post('/webhook', function(req, res){
		
		var rawBody = req.rawBody.toString('utf8');
		var student_obj = JSON.parse(rawBody);
		
		var field = student_obj.entry['0'].changes['0'].field;
			
		if(field == 'conversations'){
			conv = student_obj.entry['0'].changes['0'].value.thread_id;
			//chat('hihi');
			var id_con = student_obj.entry['0'].id;
			var url = 'https://graph.facebook.com/v2.11/'+conv+'/messages?fields=message,from,created_time&access_token=EAAEfHG6gfw4BALB9Ba0lhIPco2xZBCBGWKhJdf0IAZAyyozsMYJDVe6yPB6RN5Xtb2MgZB710SIai8k9kLsZAZAkoPlOzhLzoiOgxW58ekQFwagG8ZCmb0H9Lgq0ahyuZCpZCATa1RvD8fVCMZBMlLG9nujLRJM5vBdvErHwkeZBKUFAZDZD';
			
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var info = JSON.parse(body);
					var ms = info.data[0];
					var str = ms.message;
					var name = ms.from.name;
					io.emit('chat message', name+': '+str);
					res.setHeader('test', '1')
					res.send(info);
					console.log(info);
				}
			})
			
			/*$messages = $fb->get($conv."/messages?fields=message,from,created_time",$token)->getBody();
			$ar_messages = json_decode($messages, true);			
			$ms = $ar_messages['data'][0];			
			$str = $ms['message'];
			$parsed = $this->get_string_between($str, '[search]', '[/search]');
			if($parsed != ""){				
				foreach($array as $sp){
					if (strpos($sp['title'], $parsed) !== false) {
						$response = $fb->post($conv.'/messages',array ('message' => $sp['title'].' '.$sp['link'],),$token); die;
					}
				}
			}*/
		}
		//res.send(field);
		//console.log(field);

	});
	app.get('/webhook', function(req, res){
		console.log(req.param);
		var challenge = req.param('hub.challenge');
		var verify_token = req.param('hub.verify_token');
		if (verify_token === '123456') {
			res.send(challenge);
		}
		
		
		//var k = req.param('a');
		//console.log(k);

	});
	app.post('/t', function(req, res){
		//app.use(bodyParser.urlencoded({ extended: false }));

		// parse application/json
		//app.use(bodyParser.json());
		
		var k = req.body;
		res.send(k);
		console.log(k);
	});

	io.on('connection', function(socket){
		socket.on('chat message', function(message){
	  
		io.emit('chat message', message);
		var headers = {
			'User-Agent':       'Super Agent/0.0.1',
			'Content-Type':     'application/x-www-form-urlencoded'
		}

		// Configure the request
		var options = {
			url: 'https://graph.facebook.com/v2.11/'+conv+'/messages?access_token='+token,
			method: 'POST',
			headers: headers,
			form: {'message': message}
		}

		// Start the request
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				console.log(body)
			}
		})
	  });
	});


	/*http.listen(port, function(){
	  console.log('listening on *:' + port);
	});*/
	https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(port, function(){
	  console.log('listening on *:' + port);
	})
})
