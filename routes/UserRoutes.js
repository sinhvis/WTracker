var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Conversation = mongoose.model('Conversation') ;

var passport = require('passport'); //Multiple ways of bringing authentication from different providers. such as fb, local, google, twitch



router.post('/register', function(req, res) {

	var user = new User(req.body); //bringing in the request, and adding a document from our schema.
	user.setPassword(req.body.password); //We are running a model function, which encrypts our password.
	user.save(function(err, result) { //we are saving that user to our collection
		if(err) console.log(err); //if err console.log err, either 400-500
		if(err) return res.status(500).send({err: "Issues with the server"}); //server error
		if(!result) return res.status(400).send({err: "You messed up."}); //error in saving
		res.send(); //completing the post.
	})
});

router.post('/login', function(req, res, next) { //goes to passport module, in config.
	passport.authenticate('local', function(err, user, info){ //calling from the passport
		if(!user) return res.status(400).send(info);
		res.send({token: user.generateJWT()}); //generating a token when there is a user in the collection.
	})(req, res, next);
});

// getting an individual user
router.param('id', function(req, res, next, id) {
	User.findOne({
		_id: id
	}, function(err, user) {
		if(err) return next({
			err: err, 
			type: 'client'
		}) ;
			req.user = user;
			next() ;
		});
});

// GET /
// gets all users
router.get('/', function(req, res) {
	var users = res ;
	User.find({})
	.exec(function(err, users) {
		if(err) return res.status(500).send({ err: "Error inside the server." }) ;
		if(!users) return res.status(400).send({ err: "Users aren't here." }) ;
		res.send(users);
	}) ;
}) ;

// Should return users that have Conversations started.
// GET /user/getActiveUsers
router.get('/getConvos/:id', function(req, res){
	User.findOne({_id: req.user._id}).populate('messages').exec(function(err, userWithConversationsPopulated){

		if (err) res.status(500).send({error: "Problem with populating messages"});
		userWithConversationsPopulated.messages = userWithConversationsPopulated.messages.filter(function(item){
			return item.messages.length > 0;
		});

		res.send({convos: userWithConversationsPopulated.messages});
	})
});

// GET /user
// gets user bases on id.
router.get('/:id', function(req, res) {
	res.send(req.user) ;
}) ;


router.put('/:id', function(req, res) {
	var userProfile = req.body ;
	User.update({ _id: req.body._id }, userProfile)
	.exec(function(err, user) {
		if(err) return res.status(500).send({ err: "error getting user to edit" }) ;
		if(!user) return res.status(400).send({ err: "user profile doesn't exist" }) ;
		res.send(user) ;
	}) ;
}) ;


// router.get('/chatStart', function(req, res) {
// 	console.log("Socket") ;
// 	io.on('connection', function(socket){
// 		socket.on('chat message', function(msg){
// 			io.emit('chat message', msg);
// 		});
// 	});
// }) ;

module.exports = router;
