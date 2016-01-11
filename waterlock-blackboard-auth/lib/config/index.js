'use strict';

var path = require('path');
var _ = require('lodash');
var defaults = require('./default');

var name = "waterlock-blackboard-auth";
var configPath = path.normalize(__dirname + '/../../../../config/waterlock.js');

try {
	var config = require(configPath).waterlock;
} catch (error) {
	throw 'Waterlock is not installed';
}

var authMethod = config.authMethod;
if(_.isArray(authMethod)){
	//It will be one of them if this module was loaded in the first place
	for(var i=0; i<authMethod.length; i++){
		var method = authMethod[i];
		if(method.name === name){
			authMethod = method;
			break;
		}
	}
}

//Same for every provider for now
var callbackURL = config.baseUrl;
if(config.pluralizeEndpoints){
	callbackURL = path.normalize(callbackURL+"/auths/blackboard_callback");
}else{
	callbackURL = path.normalize(callbackURL+"/auth/blackboard_callback");
}

if(!_.isArray(authMethod.provider)){
	authMethod.provider = [ authMethod.provider ];
}

//Defaults for auth object
_.defaults(authMethod,defaults.general);

//Defaults for providers
_.forEach(authMethod.provider,function(provider){
	provider.callbackUrl = callbackURL;
	_.defaults(provider,defaults.provider);
});


module.exports.raw = authMethod;


module.exports.providerCount = function(){
	return authMethod.provider.length;
}

module.exports.getProvider = function(id){
	for(var i=0; i<authMethod.provider.length; i++){
		var provider = authMethod.provider[i];
		if(provider.id === id){
			return provider;
		}
	}
	return null;
}

module.exports.getSingleProvider = function(){
	return authMethod.provider[0];
}
