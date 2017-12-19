var app = require('express')();
var bodyParser = require('body-parser');

var http = require('http').Server(app);
var io = require('socket.io')(http);
const request = require('request-promise');  
var port = process.env.PORT || 3000;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.post('/api', function(req, res) {
    var user_id = req.body.id;
    var token = req.body.token;
    var geo = req.body.geo;
	console.log(req.query);
	console.log(req.body);
    res.send(user_id + ' ' + token + ' ' + geo);
});
app.get('/t', function(req, res){
	var body = ""; // request body
	//console.log("haha");
	//return "kaka";
	var k = req.param('a');
	console.log(k);

});
app.post('/t', function(req, res){
	//app.use(bodyParser.urlencoded({ extended: false }));

	// parse application/json
	//app.use(bodyParser.json());
	
	var k = req.param('a');
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
