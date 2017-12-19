var app = require('express')();

var http = require('http').Server(app);
var io = require('socket.io')(http);
const request = require('request-promise'); 

var port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))

var rawBodyParser = require('raw-body-parser');
app.use(rawBodyParser());

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.post('/webhook', function(req, res){
	console.log(req.body);
	var challenge = req.body.hub_challenge;
	var verify_token = req.body.hub_verify_token;
	//console.log(req.body);
	if (verify_token === '123456') {
		res.send(verify_token);
	} 
	
	
	/*var rawBody = req.rawBody.toString('utf8');
	var student_obj = JSON.parse(rawBody);
	 
	console.log("Name: " + student_obj.name);*/
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
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
