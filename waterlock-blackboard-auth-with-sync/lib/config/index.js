'use strict';

var path = require('path');
var _ = require('lodash');
var defaults = require('./default');

var name = "waterlock-blackboard-auth-with-refresh";
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
var callbackURLBase = config.baseUrl;
var callbackURLPanopto;
var callbackURLBlackboard;

if(config.pluralizeEndpoints){
	callbackURLBlackboard = path.normalize(callbackURLBase+"/auths/blackboard_callback");
	callbackURLPanopto = path.normalize(callbackURLBase+"/auths/panopto_callback");
}else{
	callbackURLBlackboard = path.normalize(callbackURLBase+"/auth/blackboard_callback");
	callbackURLPanopto = path.normalize(callbackURLBase+"/auth/panopto_callback");
}

if(!_.isArray(authMethod.provider)){
	authMethod.provider = [ authMethod.provider ];
}

//Defaults for auth object
_.defaultsDeep(authMethod,defaults.general);

//Defaults for providers
_.forEach(authMethod.provider,function(provider){
	provider.callbackURLBlackboard = callbackURLBlackboard;
	provider.callbackURLPanopto = callbackURLPanopto;
	_.defaultsDeep(provider,defaults.provider);
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
