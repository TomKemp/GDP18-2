

module.exports = {
  show:function(req,res){
  	var recordingId = req.param("id");

  	Recording.findOne({id:recordingId}).exec(function(err,recording){
  		if(err || !recording){
  			res.status(404);
  			return res.send("Not found");
  		}

  		return res.view('recording',{ recording: recording });
  	});

    
  }
};