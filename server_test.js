var express = require('express');

var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var fb_login = require("./fb.js");

var app = require('express')();

var http = require('http').Server(app);
var https = require('https');
//var pem = require('pem')
var io = require('socket.io')(http);
const request = require('request-promise');
var api = require('request');
const fs = require('fs');
var port = process.env.PORT || 3003;





app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


var token = 'EAAEfHG6gfw4BALB9Ba0lhIPco2xZBCBGWKhJdf0IAZAyyozsMYJDVe6yPB6RN5Xtb2MgZB710SIai8k9kLsZAZAkoPlOzhLzoiOgxW58ekQFwagG8ZCmb0H9Lgq0ahyuZCpZCATa1RvD8fVCMZBMlLG9nujLRJM5vBdvErHwkeZBKUFAZDZD';	
var conv = "";

  //var app = express()
  // Define routes.
	app.get('/home',
		function(req, res) {
			/*console.log("=======");
			console.log(profile);
			console.log("=======");*/
			res.render('home', { user: req.user });
		});

	app.get('/login',
		function(req, res){
			res.render('login');
		});

	app.get('/login/facebook',
		passport.authenticate('facebook'));

	app.get('/login/facebook/return', 
		passport.authenticate('facebook', { failureRedirect: '/login' }),
		function(req, res) {			
			res.redirect('/');
		});

	app.get('/profile',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
			var token = req.user.token;
			//console.log("=======");			
			var url = 'https://graph.facebook.com/v2.11/me/accounts?access_token='+token;
			console.log(url);
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					//console.log(raw_obj);
					io.emit('facebook_page', raw_obj);
					req.user.pages = raw_obj;
					//cb(null, req.user);
					//console.log("=======");
				}
				
			})
			res.render('profile', { user: req.user });
	});
	
	app.get('/',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
			
			res.sendFile(__dirname + '/server_test.html');
			io.emit('test', "hehe");
	});
	
	/*app.get('/', function(req, res){
		console.log("=======");
		console.log(req.user);
		console.log("=======");		
		res.sendFile(__dirname + '/index.html');
	});*/
	
	app.post('/webhook', function(req, res){		
		var rawBody = req.rawBody.toString('utf8');
		var student_obj = JSON.parse(rawBody);		
		var field = student_obj.entry['0'].changes['0'].field;			
		if(field == 'conversations'){
			conv = student_obj.entry['0'].changes['0'].value.thread_id;
			var id_con = student_obj.entry['0'].id;
			var url = 'https://graph.facebook.com/v2.11/'+conv+'/messages?fields=message,from,created_time&access_token='+token;		
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var info = JSON.parse(body);
					var ms = info.data[0];
					var str = ms.message;
					var id = ms.id;
					var name = ms.from.name;
					var ar = [];
					if(str === ""){
						//res.end("kaka");
						//console.log("kaka");
						var url_att = 'https://graph.facebook.com/v2.11/'+id+'/attachments?access_token='+token;
						api(url_att, function (err_att, res_att, body_att) {
							
							if (!err_att && res_att.statusCode == 200) {
								//res.setHeader('test', '1');
								var body_arr = JSON.parse(body_att);						

								if(body_arr.data.length > 0){
									if(body_arr.data[0].mime_type == "image/jpeg"){
										
										str = "<a href='"+body_arr.data[0].image_data.url+"'><img src='"+body_arr.data[0].image_data.url+"' style='width:50px' /></a>";
										ar = [conv, name, str];
										io.emit('chat message', ar);
									}else{
										str = "<a href='"+body_arr.data[0].file_url+"'>"+body_arr.data[0].name+"</a>";
										ar = [conv, name, str];
										io.emit('chat message', ar);
									}
									
								}
								return body_arr;								
							}							
						})
					}else{
						ar = [conv, name, str];
						io.emit('chat message', ar);
					}				
					return true;
					//res.send(info);
					//console.log(info);
				}
			})	
		}
	});
	
	app.get('/webhook', function(req, res){
		let VERIFY_TOKEN = "123456"    
		// Parse the query params
		let mode = req.query['hub.mode'];
		let token = req.query['hub.verify_token'];
		let challenge = req.query['hub.challenge'];
		// Checks if a token and mode is in the query string of the request
		if (mode && token) {

		// Checks the mode and token sent is correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {		  
			  // Responds with the challenge token from the request
			  console.log('WEBHOOK_VERIFIED');
			  res.status(200).send(challenge);
			} else {
			  // Responds with '403 Forbidden' if verify tokens do not match
			  res.sendStatus(403);      
			}
		}
	});	
	

	io.on('connection', function(socket){
		socket.on('chat message', function(message){
			
			io.emit('chat message', message);
			
		});
		socket.on('test', function(message){
			
			io.emit('test', message);
			
		});
	});


	http.listen(port, function(){
	  console.log('listening on *:' + port);
	});
	
	

