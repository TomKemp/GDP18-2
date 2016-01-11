'use strict';

var config = require("../../config");
var blackboard = require("../../blackboard");
var panopto = require("../../panopto");
var _ = require("lodash");


//Received from panopto block but also includes jwt from earlier
module.exports = function (req, res){

	function finishLogin(err,user){
		if(err){
		    waterlock.logger.debug(err);
		    waterlock.cycle.loginFailure(req, res, null, {error: "Could not create user"});
		    return;
	    }

	    waterlock.cycle.loginSuccess(req, res, user);
	}

	var jwt = req.query.jwt;
	if(!jwt){
		waterlock.logger.debug("Token missing");
		return res.badRequest();
	}

	blackboard.verify(jwt,function(err,provider,decoded){
		if(err){
			waterlock.logger.debug(err);
			return res.badRequest();
		}

		var serverName = req.query.serverName;
		var expiration = req.query.expiration;
		var authCode = req.query.authCode;
		var externalUserKey = req.query.externalUserKey;

		//Verify that we did come from panopto
		panopto.verifyResponseAuthCode(serverName,expiration,externalUserKey,provider.panopto.secret,authCode,function(err,output){
			if(err){
				waterlock.logger.debug(err);
				return res.badRequest();
			}

			//TODO: Check has all the required keys
			var fields = ["username","provider","blackboard_id","firstname","surname","email"];

			var filtered = _.pick(decoded, fields);


			//Check that our block and the panopto block have logged in the same user
			if(extractUsername(filtered.username) !== extractUsername(output.externalUserKey)){

				waterlock.logger.debug("Usernames don't match");
				return res.badRequest();
			}

			if(provider.fieldMap){
				_.forEach(provider.fieldMap,function(newKey,oldKey){
					if(oldKey in decoded){
						filtered[newKey] = decoded[oldKey];
					}
				});
			}

			if(req.session.authenticated){
	        	filtered['user'] = req.session.user.id;
	        	waterlock.engine.attachAuthToUser(filtered, req.session.user, finishLogin);
		    }else{
		    	waterlock.engine.findOrCreateAuth({username: filtered.username}, filtered, finishLogin);
		    }


		});

	});

};



function extractUsername(full){
	var index = full.indexOf("\\");
    if(index == -1){
      return full
    }else{
      return full.substring(index+1);
    }
}