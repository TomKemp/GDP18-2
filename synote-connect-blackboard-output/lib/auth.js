
var jwt = require('jsonwebtoken');

module.exports = function(config){

	function generateToken(user,cb){

		var expires = config.token_expire_time;

		var payload = {
			service_name:config.service_name
		}
		if(user){
			payload.user = user;
		}

		var options = {
			expiresIn: expires
		}

		jwt.sign(payload, config.secret, options, cb);
	}

	function verifyToken(token,cb){
		jwt.verify(token, config.secret, function(err, decoded) {
			if(err){
				return cb(err);
			}

			cb(null,decoded);

		});
	}

	return{
		generateToken : generateToken,
		verifyToken : verifyToken
	}
	
}

