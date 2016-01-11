'use strict';

var config = require("../../config");
var blackboard = require("../../blackboard");
var panopto = require("../../panopto");
var _ = require("lodash");
var util = require("../../util");

module.exports = function (req, res){

	var jwt = req.query.jwt;
	blackboard.verify(jwt,function(err,provider,decoded){
		if(err){
			return res.badRequest();
		}

		var next = util.appendQuery(provider.callbackURLBlackboard,"jwt="+jwt);
		var encoded = encodeURIComponent(next);

		var serverName = provider.panopto.serverName;
		var key = provider.panopto.secret;
		var bounce = provider.panopto.bounce;
		var expiry = provider.panopto.key_expire_time;

		panopto.generateRequestAuthCode(serverName,expiry,key,function(err,resp){
			if(err){
				return res.badRequest();
			}

			var redirect = util.appendQuery(bounce,"serverName="+resp.serverName+"&expiration="+resp.expiration+"&authCode="+resp.authCode+"&callbackURL="+encoded);

			return res.redirect(redirect);
		});	

	});

	
};