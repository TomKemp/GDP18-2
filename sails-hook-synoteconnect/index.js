var _ = require("lodash");

module.exports = function(sails){

	var synoteConnect;
	var config;


	sails.log.info("Loading synote-connect hook");
	return {
		configure: function(){
			config = sails.config[this.configKey];
			synoteConnect = require("synote-connect")(config);
			this.routes = {
				before:synoteConnect.output.routes,
				after:{}
			};
						

			//Need to be able to add functions in the config
		},
		initialize: function(cb) {
			var eventsToWaitFor = ['hook:orm:loaded'];
			var obj = this;

		   	sails.after(eventsToWaitFor, function() {

		   		return synoteConnect.init(function(){
		   			_.extend(obj,synoteConnect);


		   			obj.input = synoteConnect.input;
		   			obj.output = synoteConnect.output;
		   			obj.util = synoteConnect.util;

		   			return cb();
		   		});

			});
		}
	};
}