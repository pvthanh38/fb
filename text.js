var express = require('express')
  , path = require('path')
  , util = require('util');

var app = express();
var http = require('http').Server(app);
var rawBodyParser = require('raw-body-parser');

app.use(rawBodyParser());
var port = process.env.PORT || 3000;




app.post('/test', function(req, res) {
	var rawBody = req.rawBody.toString('utf8');
	console.log(rawBody);
	//var obj = JSON.parse(rawBody);
	//res.send(JSON.parse('{"foo" : 1, }'));
	//res.send(obj);
	var student_string = '{"name" : "Nguyen Van Cuong", "age" : "26"}';
 
	var student_obj = JSON.parse(student_string);
	 
	console.log("Name: " + student_obj.name);
	console.log("Age: " + student_obj.age);
	
	res.send('got it');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});