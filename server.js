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
const options = {
    cert: fs.readFileSync('/etc/letsencrypt/live/lab.letweb.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/lab.letweb.net/privkey.pem')
};
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


//Facebook
// Configure view engine to render EJS templates.
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

var token = "EAAEfHG6gfw4BABJavQZCxMRaUsZAHAndYbhv1UTsnEaWvbc6dGmWrczyG1gBI7fM77plwfjOlftAIZAPkBXnK6U1RAoLUyby10y5yaE7eJlx9Oe9gskYZBcELJZB1XdWpvxiQr27rI7J6IL8XEaGZAzA7EKKRSY5yjo6XReZA4mawZDZD";
var conv = "";
var rooms = [];

	app.get('/home',
		function(req, res) {
			res.render('home', { user: req.user });
		});

	app.get('/login',
		function(req, res){	
			
			res.render('login');
		});

	app.get('/login/facebook',
		passport.authenticate('facebook'));

	app.get('/login/facebook/return', 
		passport.authenticate('facebook', { failureRedirect: '/login', scope : ['manage_pages', 'pages_show_list'] }),
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
				}
				
			})
			res.render('profile', { user: req.user });
	});
	
	app.get('/',		
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
			var token = req.user.token;
			rooms.push(token);
					
			res.render('index', { user: req.user });			
	});
	
	/*app.get('/', function(req, res){
		console.log("=======");
		console.log(req.user);
		console.log("=======");		
		res.sendFile(__dirname + '/index.html');
	});*/
	
	app.post('/webhook', function(req, res){
		var rawBody = req.rawBody.toString('utf8');
		var obj = JSON.parse(rawBody);
		
		//console.log(obj.entry['0'].changes.value);
		/*if(obj.object){
			
		}else{*/
			if(typeof obj.entry['0'].changes !== 'undefined' && typeof obj.entry['0'].changes['0'].field !== 'undefined' && obj.entry['0'].changes['0'].field  == "feed"){
				//res.send(obj);
				if(obj.entry['0'].changes['0'].value.from.id != obj.entry['0'].id){
					if(obj.entry['0'].changes['0'].field == 'feed'){
						if(obj.entry['0'].changes['0'].value.item == 'comment'){
							var comment_id = obj.entry['0'].changes['0'].value.comment_id;
							var verb = obj.entry['0'].changes['0'].value.verb;
							var page_id = obj.entry['0'].id;
							console.log(page_id);
							var token = "";
							let fs_token = (page_id) => { return new Promise((resolve, reject) => {								
								fs.readFile('list_app.json', 'utf8', function readFileCallback(err, data){
									if (err){
										console.log(err);
									} else {
									obj = JSON.parse(data); //now it an object									
									resolve(obj[page_id]);
								}});
							})}
							let reply = async () => { 								
								let token = await fs_token(page_id);
								if(verb == "add"){					
									var headers = {
										'User-Agent':       'Super Agent/0.0.1',
										'Content-Type':     'application/x-www-form-urlencoded'
									}
									// Configure the request
									var options = {
										url: 'https://graph.facebook.com/v2.11/'+comment_id+'?access_token='+token,
										method: 'POST',
										headers: headers,
										form: {'is_hidden': true}
									}			
									// Start the request
									request(options, function (error, response, body) {
										console.log(response.statusCode);
									})
									
									var options_comment = {
										url: 'https://graph.facebook.com/v2.11/'+comment_id+'/comments?access_token='+token,
										method: 'POST',
										headers: headers,
										form: {'message': "Chúng tôi đã nhận được tin và sẽ sớm liên hệ lại!"}
									}			
									// Start the request
									request(options_comment, function (error, response, body) {
										console.log(response.statusCode);
									})
								}
							}							
							reply();
						}
					}
				}
			}else{
				if(typeof obj.entry['0'].changes !== 'undefined' && typeof obj.entry['0'].changes['0'].field !== 'undefined' && obj.entry['0'].changes['0'].field  == "conversations"){
					io.emit('webhook', obj);
				}
			}
		
		//}
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

	
	
	/*setInterval(() => {		
		io.emit('load message', "new message");
	}, 3000)
	*/
	
	/*setInterval(() => {		
		fs.readFile('list_app.json', 'utf8', function readFileCallback(err, data){
			if (err){
				console.log(err);
			} else {
			obj = JSON.parse(data); //now it an object
			let reset_token = () => { return new Promise(() => {
				Object.keys(obj).forEach(function (key) {
					console.log(key);
					var token_reset = obj[key];
					
					var url = 'https://graph.facebook.com/v2.11/oauth/access_token?grant_type=fb_exchange_token&client_id=315681952268046&client_secret=6f5c5207bb4623ca26144841729797ba&fb_exchange_token='+token_reset;
					api(url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var raw_obj = JSON.parse(body);
							//console.log(raw_obj);
							obj[key] = raw_obj.access_token;
							
						}				
					})
					return obj;
					
				})
			})
			}
			
			let add = async () => { let res = await reset_token();}
			console.log(add);
			//json = JSON.stringify(obj); //convert it back to json
			//fs.writeFile('list_app.json', json, 'utf8', null); // write it back 
		}});
	}, 3000)*/
	
	
	app.get('/comment', function(req, res){
		
		var url = req.query['url'];
		var video_url = req.query['video_url'];
		var message = req.query['message'];			
		if (url && url != "") {
			var headers = {
				'User-Agent':       'Super Agent/0.0.1',
				'Content-Type':     'application/x-www-form-urlencoded'
			}
			// Configure the request
			var options = {
				url: 'https://graph.facebook.com/v2.11/me/photos?access_token='+token,
				method: 'POST',
				headers: headers,
				form: {'url': url, 'caption': message}
			}			
			// Start the request
			request(options, function (error, response, body) {
				console.log(response.statusCode);
				res.send(response.statusCode);
			})
		}
		
		if (video_url && video_url != "") {
			var headers = {
				'User-Agent':       'Super Agent/0.0.1',
				'Content-Type':     'application/x-www-form-urlencoded'
			}
			// Configure the request
			var options = {
				url: 'https://graph.facebook.com/v2.11/me/videos?access_token='+token,
				method: 'POST',
				headers: headers,
				form: {'description': message, 'description': message, 'file_url':video_url}
			}			
			// Start the request
			request(options, function (error, response, body) {
				console.log(response.statusCode);
				res.send(response.statusCode);
			})
		}
	});

	io.on('connection', function(socket){
		socket.on('chat message', function(message){
			var id = message[0];
			var message_txt = message[2];
			var token = message[1];
			//io.emit('chat message', message);
			var headers = {
				'User-Agent':       'Super Agent/0.0.1',
				'Content-Type':     'application/x-www-form-urlencoded'
			}
			// Configure the request
			var options = {
				url: 'https://graph.facebook.com/v2.11/'+id+'/messages?access_token='+token,
				method: 'POST',
				headers: headers,
				form: {'message': message_txt}
			}
			console.log(options);
			// Start the request
			request(options, function (error, response, body) {
				console.log(response.statusCode);
			})
		});
		socket.on('conversations', function(message){
			var token = message[1];
			var room = message[2];
			var url = 'https://graph.facebook.com/v2.11/'+message[0]+'/conversations?fields=senders&access_token='+token;
					
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					//io.emit('conversations', raw_obj);
					io.sockets.in(room).emit('conversations', raw_obj);
				}				
			})			
		});
		
		socket.on('messages', function(message){
			var conv = message[0];
			var token = message[1];
			var room = message[2];
			var url = 'https://graph.facebook.com/v2.11/'+conv+'/messages?fields=message,from,created_time,sticker,attachments&access_token='+token;
			
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					//io.emit('messages', raw_obj);
					io.sockets.in(room).emit('messages', raw_obj);
				}				
			})			
		});
		
		socket.on('attachments', function(message){
			var id = message[0];
			var name = message[1];
			var token = message[2];
			var url = 'https://graph.facebook.com/v2.11/'+id+'?fields=attachments&access_token='+token;
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					raw_obj.name = name;
					console.log("=======");
					console.log(raw_obj);
					console.log("=======");
					io.emit('attachments', raw_obj);					
				}				
			})			
		});
		
		socket.on('get page', function(message){
			var token = message;
			socket.join(token);
			//console.log("=======");			
			var url = 'https://graph.facebook.com/v2.11/me/accounts?access_token='+token;
			//console.log(url);
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					//console.log(raw_obj);
					fs.readFile('list_app.json', 'utf8', function readFileCallback(err, data){
						if (err){
							console.log(err);
						} else {
						obj = JSON.parse(data); //now it an object
						raw_obj.data.forEach(function (item) {
							obj[item.id] = item.access_token;
						})
						
						
						json = JSON.stringify(obj); //convert it back to json
						fs.writeFile('list_app.json', json, 'utf8', null); // write it back */
					}});
					io.sockets.in(token).emit('facebook_page', raw_obj);
					//io.emit('facebook_page', raw_obj);
					//req.user.pages = raw_obj;
					//cb(null, req.user);
					//console.log("=======");
				}
				
			})		
		});
		
		socket.on('webhook', function(message){
			var token = message[0];
			//var token = req.user.token;
			//console.log("=======44444444444444");
			//console.log(message[1]);
			var student_obj = message[1];		
			var field = student_obj.entry['0'].changes['0'].field;
			//console.log(field);
			
			if(field == 'conversations'){				
				conv = student_obj.entry['0'].changes['0'].value.thread_id;
				var id_con = student_obj.entry['0'].id;
				var url = 'https://graph.facebook.com/v2.11/'+conv+'/messages?fields=message,from,created_time,attachments&access_token='+token;		
				api(url, function (error, response, body) {
					console.log(url);
					if (!error && response.statusCode == 200) {							
						var info = JSON.parse(body);
						var ms = info.data[0];
						var str = ms.message;
						var id = ms.id;
						var name = ms.from.name;
						var ar = [];
						//console.log(ms);
						if(str === ""){
							if(ms.attachments){
								if(ms.attachments.data[0].mime_type == "image/jpeg"){
									str = "<a href='"+ms.attachments.data[0].image_data.url+"'><img src='"+ms.attachments.data[0].image_data.url+"' style='width:50px' /></a>";
									ar = [conv, name, str, id];
									io.emit('chat message', ar);
											
									
								}else{
									str = "<a href='"+ms.attachments.data[0].file_url+"'>"+ms.attachments.data[0].name+"</a>";
									ar = [conv, name, str, id];
									io.emit('chat message', ar);
									
									
								}
								
							}
							
							if(ms.sticker){
								if(ms.sticker != ""){
									str = "<a target='_blank' href='"+ms.sticker+"'><img src='"+ms.sticker+"' style='width:50px' /></a>";					
									ar = [conv, name, str, id];
									io.emit('chat message', ar);
								}
							}
							
							
							//io.emit('load message', "new message");
						}else{
							ar = [conv, name, str, id];
							io.emit('chat message', ar);
							//var str = "[search]iPhone 7[/search]";
							var pro_ar = [{'title':'iPhone X', 'url':'https://www.thegioididong.com/dtdd/iphone-x-64gb'},{'title':'iPhone 7', 'url':'https://www.thegioididong.com/dtdd/iphone-7'}];
							var txt_search = str.substring(str.lastIndexOf("[search]")+8,str.lastIndexOf("[/search]"));
							console.log(txt_search);
							
							for (i = 0; i < pro_ar.length; ++i) {
								var title_search = pro_ar[i].title;
								var pro_url = pro_ar[i].url;
								//console.log(title_search);
								if(title_search.indexOf(txt_search) != -1){
									var headers = {
										'User-Agent':       'Super Agent/0.0.1',
										'Content-Type':     'application/x-www-form-urlencoded'
									}
									// Configure the request
									var options = {
										url: 'https://graph.facebook.com/v2.11/'+conv+'/messages?access_token='+token,
										method: 'POST',
										headers: headers,
										form: {'message': pro_url}
									}
									
									console.log(options);
									// Start the request
									request(options, function (error, response, body) {
										console.log(response.statusCode);
									})
								}
							}
						}				
						return true;
					}
				})	
			}
			
		});
		
		socket.on('load message', function(message){
			var conv = message[0];
			var token = message[1];
			var room = message[2];
			var url = 'https://graph.facebook.com/v2.11/'+conv+'/messages?fields=message,from,sticker,created_time,attachments&access_token='+token;			
			api(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var raw_obj = JSON.parse(body);
					//io.emit('messages', raw_obj);
					io.sockets.in(room).emit('show message', raw_obj);
				}				
			})	
					
		});
		
		
	});


	http.listen(port, function(){
	  console.log('listening on *:' + port);
	});
	
	https.createServer(options, app).listen(3000);

