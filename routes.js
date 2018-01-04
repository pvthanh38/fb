var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;

var app = require('express')();




var token = 'EAAEfHG6gfw4BALB9Ba0lhIPco2xZBCBGWKhJdf0IAZAyyozsMYJDVe6yPB6RN5Xtb2MgZB710SIai8k9kLsZAZAkoPlOzhLzoiOgxW58ekQFwagG8ZCmb0H9Lgq0ahyuZCpZCATa1RvD8fVCMZBMlLG9nujLRJM5vBdvErHwkeZBKUFAZDZD';	
var conv = "";

  //var app = express()
  // Define routes.
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
		passport.authenticate('facebook', { failureRedirect: '/login' }),
		function(req, res) {
			//console.log(res);
			res.redirect('/home');
		});

	app.get('/profile',
		require('connect-ensure-login').ensureLoggedIn(),
		function(req, res){
			res.render('profile', { user: req.user });
	});
	app.get('/', function(req, res){
	  res.sendFile(__dirname + '/index.html');
	});
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
					
					if(str === ""){
						//res.end("kaka");
						//console.log("kaka");
						var url_att = 'https://graph.facebook.com/v2.11/'+id+'/attachments?access_token='+token;
						api(url_att, function (err_att, res_att, body_att) {
							
							if (!err_att && res_att.statusCode == 200) {
								//res.setHeader('test', '1');
								var body_arr = JSON.parse(body_att);
						
								res.send(body_arr.data[0].id);
								if(body_arr.data[0].mime_type){
									if(body_arr.data[0].mime_type == "image/jpeg"){
										
										str = "<a href='"+body_arr.data[0].image_data.url+"'><img src='"+body_arr.data[0].image_data.url+"' style='width:50px' /></a>";
										io.emit('chat message', name+': '+str);
									}else{
										str = "<a href='"+body_arr.data[0].file_url+"'>"+body_arr.data[0].name+"</a>";
										io.emit('chat message', name+': '+str);
									}
									
								}else{
								
								}
								return body_arr;
								//console.log(body_arr);
								
							}							
						})
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



