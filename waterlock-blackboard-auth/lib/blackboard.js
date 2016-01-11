
var jwt = require('jsonwebtoken');
var path = require('path');
var config = require('./config');


module.exports.redirect = function(provider,cb){
	generateToken(provider, function(token){
		var path = appendQuery(provider.bounce,"jwt="+token);
		cb(path);
	});
	
}

module.exports.verify = function(token,cb){
	return verifyToken(token,cb);
}

function generateToken(provider,cb){
	var next = provider.callbackUrl;
	var expires = provider.token_expire_time;

	var payload = {
		service_name:config.raw.service_name,
		next:next
	}

	var options = {
		expiresIn: expires
	}

	jwt.sign(payload, provider.secret, options,cb);
}

function verifyToken(jsonWebToken,cb){
	//Doesn't verify token - just reads payload
	var insecure_decode = jwt.decode(jsonWebToken);

	if(!insecure_decode || !insecure_decode.provider){
		return cb("Provider not set");
	}

	var provider = config.getProvider(insecure_decode.provider);
	if(!provider){
		return cb("Provider not found");
	}

	//Verifies token
	jwt.verify(jsonWebToken, provider.secret, function(err, decoded) {
		if(err){
			return cb("Invalid token (may have expired)");

		}else{
			if(!decoded.username || !decoded.provider){
				return cb("Token does not contain required fields");
			}

			cb(null,provider,decoded);
		}
	});
}


function appendQuery(url,addition){
	if(url.indexOf('?') !== -1){
		return url + "&" + addition;
	}else{
		return url + "?" + addition;
	}
}
