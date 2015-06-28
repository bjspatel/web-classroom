var LocalStrategy	= require("passport-local").Strategy,	//Load local strategy
	Model			= require("../mysql/model"),			//Load bookshelf model
	bcrypt			= require("bcrypt-nodejs");


module.exports = function (passport, usersList) {

	//serialize the user for the session
	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	//deserialize user from the session
	passport.deserializeUser(function (user, done) {
		done(null, user);
	});

	//define local signup strategy
	passport.use(
		"local-signup",
		new LocalStrategy(
			{
				usernameField: "username",
				passwordField: "password",
				passReqToCallback: true
			},
			function(req, username, password, done) {
				process.nextTick(function() {
					new Model.User({user_name: username}).fetch().then(function(model) {
						if(model) {
							return done(null, false, req.flash("signupMessage", "The user '" + username + "' already exists."));
						} else {
							//create a new user
							var newUser			= {};
							newUser.first_name	= req.body.firstname;
							newUser.last_name	= req.body.lastname;
							newUser.user_type	= req.body.usertype;
							newUser.user_name	= username;
							newUser.password	= bcrypt.hashSync(password);

							var signUpUser = new Model.User(newUser);
					        signUpUser.save()	//save the user
							.then(function(model) {
								var localUserObj = JSON.parse(JSON.stringify(newUser));
								delete localUserObj["password"];
								usersList.allUsers.push(localUserObj);
								return done(null, model);
							})
							.catch(function(err) {
								console.error("Error while saving user: " + JSON.stringify(err));
							});
						}
					});
				});
			}
		)
	);

	//define local signin strategy
	passport.use(
		"local-signin",
		new LocalStrategy(
			{
				usernameField: "username",
				passwordField: "password",
				passReqToCallback: true
			},
			function(req, username, password, done) {

				new Model.User({user_name: username})
				.fetch()
				.then(function(data) {
					var user = data;
					if(!user) {
						//user does not exist
						return done(null, false, req.flash("signinMessage", "User '" + username + "' does not exist."));
					} else {
						user = data.toJSON();
						if(!bcrypt.compareSync(password, user.password)) {
							//user is found, but password is incorrect
							return done(null, false, req.flash("signinMessage", "Password is incorrect."));
						} else {
							//return found user
							return done(null, user);
						}
					}	
				})
				.catch(function(err) {
					console.error("Error while loading user: " + JSON.stringify(err));
				});
			}
		)
	);
};
