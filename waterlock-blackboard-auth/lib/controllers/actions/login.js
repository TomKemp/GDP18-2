'use strict'

var config = require("../../config");
var blackboard = require("../../blackboard");
var _ = require("lodash");


module.exports = function(req, res){

	var providerString = req.query.provider;

	var provider;

	if(providerString){
		provider = config.getProvider(providerString);
		if(!provider){
			waterlock.logger.debug("Provider not found");
			return res.badRequest();
		}
	}else{
		if(config.providerCount() !== 1){
			waterlock.logger.debug("You must specify a provider");
			return res.badRequest();
		}
		provider = config.getSingleProvider();
	}

	blackboard.redirect(provider,function(path){
		return res.redirect(path);
	});
	
};

