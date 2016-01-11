'use strict';

module.exports = function(req, res, next) {
  
  var recordingId = req.param("id");
  var user = req.session.user;
  var blackboard_id = user.auth.blackboard_id;

  if(!blackboard_id){
    return res.forbidden();
  }

  Recording.findOne({id:recordingId}).populate("collection").exec(function(err,recording){
  		if(err || !recording){
  			return res.notFound();
  		}

    //TODO: Have to make sure that the "recording" is in the correct format (e.g. id, inputId, collection.inputId)

  	sails.hooks['synoteconnect'].util.canViewRecordings([recording],blackboard_id,function(err,response){
      //response is the array of input recordings filtered by whether the user can see them or not (with .canView set to true too)

  		if(err){
  			return res.forbidden();
  		}

  		if(response[0] && response[0].id === recording && response[0].canView === true){
  			return next();
  		}else{
  			return res.forbidden();
  		}

  	});
  		
  });

};
