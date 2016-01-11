
module.exports = function(config,utilFunctions,input){

	var auth = require("./auth")(config);

	var policies = {
		"viewer":function(req,res,next){
			var courseId = req.param("id");
			var token = req.param("token");

			auth.verifyToken(token,function(err,result){
				if(err){
					res.status(403);
					return res.send("Forbidden");
				}

				var role = result.subjectRole;
				if(role === 'viewer' || role === "creator"){
					req.tokenContents = result;
					next();
				}else{
					res.status(403);
					return res.send("Forbidden");
				}

			});
		},
		"creator":function(req,res,next){
			var courseId = req.param("id");
			var token = req.param("token");

			auth.verifyToken(token,function(err,result){
				if(err){
					res.status(403);
					return res.send("Forbidden");
				}

				var role = result.subjectRole;
				if(role === "creator"){
					req.tokenContents = result;
					next();
				}else{
					res.status(403);
					return res.send("Forbidden");
				}

			});
		}
	}

	var routes = {

		'GET /connect/course/:id':{
			policy:"viewer",
			route: function(req,res,next){
				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;
				var courseId = req.param("id");
				utilFunctions.getCourseContents(courseId,outputUser,function(err,contents){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}

					var configured = contents !== null;

					var response = {
						configured : configured,
						recordings : contents
					}

					return res.json(response);
				});
			}
		},
		'POST /connect/course':{
			policy:"creator",
			route: function(req,res,next){

				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;
				var details = req.body;

				utilFunctions.configureCourse(details,outputUser,function(err,success){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}
	
				 	return res.ok();

				});
			}
		},
		'GET /connect/course/:id/mappings':{
			policy:"viewer",
			route: function(req,res,next){
				if(!input){
					res.status(400);
					return res.send("Cannot be used without input configured");
				}

				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;
				var courseId = req.param("id");

				utilFunctions.getMappings(courseId,outputUser,function(err,contents){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}
					return res.json(contents);
				});
			}

		},
		'POST /connect/course/:id/mappings':{
			policy:"creator",
			route: function(req,res,next){
				if(!input){
					res.status(400);
					return res.send("Cannot be used without input configured");
				}

				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;
				var courseId = req.param("id");
				var collection = req.body.collection;

				if(!_.isArray(collection)){
					collection = [collection];
				}

				async.eachSeries(collection, function(id, callback) {

					utilFunctions.createMapping(courseId,id,outputUser,function(err,contents){
						if(err){
							return callback(err);
						}
						return callback(null,true);
					});

				}, function(err){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}
				    
				    return res.ok();
				});
			}
		},
		'DELETE /connect/course/:id/mappings':{
			policy:"creator",
			route: function(req,res,next){
				if(!input){
					res.status(400);
					return res.send("Cannot be used without input configured");
				}

				var courseId = req.param("id");
				var collection = req.body.collection;
				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;

				if(!_.isArray(collection)){
					collection = [collection];
				}


				async.eachSeries(collection, function(id, callback) {

					utilFunctions.deleteMapping(courseId,id,outputUser,function(err,contents){
						if(err){
							return callback(err);
						}
						return callback(null,true);
					});

				}, function(err){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}
				    
				    return res.ok();
				});
			}
		},
		'GET /connect/course/:id/suggest':{
			policy:"creator",
			route: function (req, res, next){
				if(!input){
					res.status(400);
					return res.send("Cannot be used without input configured");
				}

				var tokenContents = req.tokenContents;
				var outputUser = tokenContents.user;
				var courseId = req.param("id");

				utilFunctions.getPossibleMappings(courseId,outputUser,function(err,contents){
					if(err){
						res.status(403);
						return res.send("Forbidden");
					}
					return res.json(contents);
				});
			}
		}

	}

	var output = {};

	_.forEach(routes,function(value,path){
		var policy = policies[value.policy];
		output[path] = [policy,value.route];
	});

	return output;
}
