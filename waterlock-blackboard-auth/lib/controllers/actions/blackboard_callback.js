'use strict';

var config = require("../../config");
var blackboard = require("../../blackboard");
var _ = require("lodash");




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

		//TODO: Check has all the required keys
		var fields = ["username","provider","blackboard_id","firstname","surname","email"];

		var filtered = _.pick(decoded, fields);

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

};