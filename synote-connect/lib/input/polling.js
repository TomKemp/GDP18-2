
var _ = require("lodash");


module.exports = function(config,inputInterface,storage){

	var polling;

	function init(cb){
		polling = setInterval(checkForChanges, config.poll_rate*1000);
		return cb();
	}

	var listeners = {}

	function addListener(name,func){
		if(!listeners[name]){
			listeners[name] = [];
		}

		if(_.isArray(func)){
			listeners[name] = listeners[name].concat(func);
		}else{
			listeners[name].push(func);
		}
		
	}

	function informListeners(name){
		var obj = this;
		if(_.has(listeners,name)){
			//Remove first argument
			var args = _.values(arguments);
			args.shift();
			var list = listeners[name];
			async.nextTick(function(){
   				_.forEach(list,function(func){
					func.apply(obj,args);
				});
			});
			
		}
	}

	function findById(array,id){
		return _.find(array, {inputId:id});
	}

	function toIdList(array){
		return _.map(array,function(element){
			return element.inputId;
		});
	}


	function checkForChanges(){

		storage.getTrackedCollections(function(err,trackedCollections){
			if(err){
				return;
			}

			var trackedIds = toIdList(trackedCollections);
		
			if(trackedIds.length === 0){
				return;
			}

			var wait = 0;
			var increment = 10;

			_.forEach(trackedIds,function(id){
				setTimeout(function(){
					inputInterface.getCollectionContents(id,function(err,collection){
						if(err){
							return informListeners("polling.error",id);
						}

						informListeners("polling.success",id);

						var previousContents = findById(trackedCollections,id).knownRecordings;
						var currentContents = toIdList(collection.recordings);

						var added = _.difference(currentContents,previousContents);
						var removed = _.difference(previousContents,currentContents);

						var allAdded = _.filter(collection.recordings,function(recording){
							return  _.includes(added,recording.inputId);
						});

						var userIds = _.pluck(allAdded, 'creatorId');

						if(userIds.length > 0 && config.proxy_account_admin){
							
							inputInterface.getUserDetails(userIds,function(err,users){
								if(err){
									return next();
								}
								_.forEach(users,function(user){
									_.forEach(allAdded,function(recording){
										if(recording.creatorId === user.inputId){
											recording.creatorUsername = user.userKey;
										}
									});
								});

								return next();
							});
						}else{
							return next();
						}


						function next(){
							storage.updateTrackedCollection(id,currentContents,function(err,done){
								if(err){
									return;
								}

								if(allAdded.length > 0){
									informListeners("recording.new",id,allAdded);
								}
								
								if(removed.length >0){
									informListeners("recording.removed",id,removed);
								}
							});
						}	

					});
				},wait);
				wait += increment;
			});

		});
		
	}


	return{
		stopPolling : function(){
			clearInterval(polling);
		},
		informListeners : informListeners,
		addListener : addListener,
		init : init
	}



}

