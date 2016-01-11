
var _ = require("lodash");
var request = require('request');
var url = require('url');

var internalConfig = require("./config");


module.exports = function(externalConfig,utilFunctions,input){

	var auth = require("./auth")(externalConfig);
	var routes = require("./routes")(externalConfig,utilFunctions,input);

	function init(cb){
		return cb();
	}
	
	function alertStudents(courseId,details,cb){

		var path = url.resolve(externalConfig.building_block_path, externalConfig.alert_students_endpoint);

		auth.generateToken(null,function(token){

			var body = _.extend(
				{
					title:"",
					body:"",
					courseId:courseId,
					token:token
				},details);

			var options = {
				url: path,
				headers: {
					'Content-Type': 'text/json'
				},
				body:JSON.stringify(body)
			}

			request.post(options, function (err, httpResponse, body) {
				if (err) {
					return cb("Request error");
				}
				return cb(null,true);
			});

		});

	}

	function _extractCourse(course){
		return {
			outputId : course.id,
			name : course.name
		}
	}

	function getUserAccessPermissions(user,cb){
		var path = url.resolve(externalConfig.building_block_path, externalConfig.get_access_permission_endpoint);

		auth.generateToken(user,function(token){

			var body =
				{
					user:user,
					token:token
				};

			var options = {
				url: path,
				headers: {
					'Content-Type': 'text/json'
				},
				body:JSON.stringify(body)
			}

			

			request.post(options, function (err, httpResponse, body) {
				if (err) {
					return cb("Request error");
				}

				var result = {
					creator:[],
					viewer:[]
				};

				var creator = body.creator;
				var viewer = body.viewer;


				_forEach(creator,function(course){
					result.creator.push(_extractCourse(course));
				});

				_forEach(viewer,function(course){
					result.viewer.push(_extractCourse(course));
				});

				return cb(null,body);
			});

		});
	}

	/*

	{
		creator:[
			{
					
			}
		]
	}

	*/

	function canViewByCourse(recordings,outputUser,cb){
		_.forEach(inputRecordings,function(rec){
			rec.canView = false;
		});

	
		getUserAccessPermissions(outputUser,function(err,permissions){
			if(err){
				return cb(err);
			}

			var output = [];
			var canViewId = [];

			var totalPermissions = _.union(permissions.creator,permissions.viewer);

			_.forEach(totalPermissions,function(course){
				canViewId.push(course.outputId);
			});

			_.forEach(recordings,function(rec){
				if(_.includes(canViewId,rec.course.outputId)){
					rec.canView = true;
					output.push(rec);
				}
			});

			cb(null,output);
		});
	}

	return {
		routes : routes,
		alertStudents : alertStudents,
		getUserAccessPermissions : getUserAccessPermissions,
		canViewByCourse : canViewByCourse,
		init : init
	}
	

	
}
