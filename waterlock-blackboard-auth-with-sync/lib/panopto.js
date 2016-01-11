
var crypto = require('crypto');


module.exports.generateRequestAuthCode = function(serverName,expirationSeconds,key,cb){
	var expiration = (new Date((new Date).getTime() + (expirationSeconds*1000))).getTime();

	var response = "serverName=" + serverName + "&expiration=" + expiration;

	_generateAuthCode(response, key, function(err,authCode){
		if(err){
			return cb(err);
		}

		return cb(null,{
			serverName:serverName,
			expiration:expiration,
			authCode:authCode
		});
	});
}

module.exports.verifyResponseAuthCode = function(serverName, expiration, externalUserKey, key, authCode,cb){
	var now = (new Date).getTime();
	if(now>expiration){
		return cb("Expired");
	}

	var response = "serverName=" + serverName + "&externalUserKey=" + externalUserKey + "&expiration=" + expiration;


	_generateAuthCode(response,key,function(err,code){
		if(err){
			cb(err);
		}

		if(code === authCode){
			cb(null,{
				serverName:serverName,
				expiration:expiration,
				externalUserKey:externalUserKey,
				authCode : authCode
			});
		}else{
			cb("Invalid authCode");
		}
	})
}


function _generateAuthCode(request, key, cb){
	var shasum = crypto.createHash('sha1');
	var string =  request + "|" + key;
	shasum.update(string);
	return cb(null,shasum.digest('hex').toUpperCase());
}