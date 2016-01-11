
//Input

module.exports = function(inputConfig,util){

	var inputModule = require(inputConfig.module)(inputConfig);
	var inputInternalConfig = inputModule.config;

	var impl = {
		getTrackedCollection : null,
		getTrackedCollections : null,
		updateTrackedCollection : null,
		convertFromInputUser : null,
		convertToInputUser : null
	};
	

	var polling = null;

	configureInput(inputConfig);

	function init(cb){
		inputModule.init(function(){
			if(polling){
				return polling.init(cb);
			}
			return cb();
		});
	}

	function configureInput(inputConfig){
		switch (inputInternalConfig.update_method) {
		  case "poll":
		  	sails.log.info("Input will be polled every "+inputConfig.poll_rate+" seconds");
		    polling = require("./polling")(inputConfig,inputModule,impl);
		    break;
		  case "webhook":
		    throw "Web hooks not yet implemented";
		    break;
		  default:
		    throw "Update method unknown";
		}
	}

	function addAllListeners(listenersMap){
		_.forEach(listenersMap,function(listener,name){
			polling.addListener(name,listener);
		});
	}

	function setAllImp(functionMap){
		_.assign(impl,functionMap);
		customStorage = true;
	}

	function addListener(name,listener){
		polling.addListener(name,listener);
	}

	function trackCollection(collectionId,userId,cb){
		inputModule.trackCollection(collectionId,userId,function(err,result){
			if(err){
				return cb(err);
			}
			return cb(null,true);
		});	
	}

	function getTrackedCollections(){
		return impl.getTrackedCollections();
	}

	return {
		getCollectionContents : function(collectionId,cb){
			return inputModule.getCollectionContents(collectionId,cb);
		},
		getCollectionDetails : function(collectionId,synoteUser,cb){
			impl.convertToInputUser(synoteUser,function(inputUser){
				return inputModule.getCollectionDetails(collectionId,inputUser,cb);
			});
		},
		getUserCreatorCollections : function(synoteUser,cb){
			impl.convertToInputUser(synoteUser,function(inputUser){
				return inputModule.getUserCreatorCollections(inputUser,cb);
			});
		},
		canViewByRecording : function(recordings, synoteUser,cb){
			impl.convertToInputUser(synoteUser,function(inputUser){
				return inputModule.canViewByRecording(recordings,inputUser,cb);
			});
		},
		canViewByCollection : function(recordings, synoteUser,cb){
			impl.convertToInputUser(synoteUser,function(inputUser){
				return inputModule.canViewByCollection(recordings,inputUser,cb);
			});
		},
		convertFromInputUser : function(){
			return impl.convertFromInputUser.apply(this,arguments);
		},
		convertToInputUser : function(){
			return impl.convertToInputUser.apply(this,arguments);
		},
		uploadTranscript : function(recordingInputId,fileContents,cb){
			return inputModule.uploadTranscript(recordingInputId,fileContents,cb);
		},
		addListener : addListener,
		addAllListeners : addAllListeners,
		trackCollection : trackCollection,
		getTrackedCollections : getTrackedCollections,
		init : init,
		setAllImp : setAllImp,
	}

}








