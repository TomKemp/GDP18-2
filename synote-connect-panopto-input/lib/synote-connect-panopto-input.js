
var _ = require("lodash");
var latestAsync = require("async");

var internalConfig = require("./config");

module.exports = function(externalConfig){

	var panoptoConfig = {
		soap_base : externalConfig.server_protocol + "://" + externalConfig.server_base
	}
	var panopto = require("manual-panopto-api")(panoptoConfig);
	var ep = panopto.endpoints;

	var viewerProxy = externalConfig.proxy_account_viewer;
	var proxyAuthViewer = {
		UserKey:viewerProxy.UserKey,
		Password:viewerProxy.Password
	}

	var creatorProxy = externalConfig.proxy_account_creator;
	if(creatorProxy){
		var proxyAuthCreator = {
			UserKey:creatorProxy.UserKey,
			Password:creatorProxy.Password
		}	
	}
	
	var adminProxy = externalConfig.proxy_account_admin;
	if(adminProxy){
		var proxyAuthAdmin = {
			UserKey:adminProxy.UserKey,
			Password:adminProxy.Password
		}
	}

	function init(cb){
		return cb();
	}

	function _determineAuth(inputUser,params,options){
		var response = {
			params : {},
			options : {}
		}
		if(inputUser.cookie){
			response.options.cookies = {
				".ASPXAUTH":inputUser.cookie
			};
		}

		response.params.auth = {
			UserKey:inputUser.UserKey,
		};

		if(inputUser.Password){
			response.params.auth.password = inputUser.Password;
		}else{
			response.params.auth.AuthCode = _generateAuthCode(inputUser.UserKey);
		}

		_.extend(params,response.params);
		_.extend(options,response.options);
	}

	function getUserDetails(userArray,cb){
		if(!adminProxy){
			return cb("No admin proxy defined");
		}

		var params = {
			auth:proxyAuthAdmin,
			userIds:userArray
		};
		var options = {};

		ep.UserManagement.GetUsers(params,options,function(err,response){
			if(err){
				return cb(err);
			}

			var users =  response[0].GetUsersResponse[0].GetUsersResult[0].User;

			var results = _.map(users,function(user){
				return _extractUser(user);
			});

			return cb(null,results);
		});

	}

	function uploadTranscript(inputId,fileContents,cb){
		if(!creatorProxy){
			return cb("No creator proxy defined");
		}

		var params = {
			auth:proxyAuthCreator,
			sessionId:inputId,
			fileContents : fileContents
		};
		var options = {};

		ep.SessionManagement.UploadTranscript(params,options,function(err,success){
			if(err){
				return cb(err);
			}

			return cb(null,success);
		});
	
	}

	function getUserCreatorCollections(inputUser,cb){
		var params = {};
		var options = {};

		_determineAuth(inputUser,params,options);

		ep.AccessManagement.GetSelfUserAccessDetails(params,options,function(err,response){
			if(err){
				return cb(err);
			}

			var resp =  response[0].GetSelfUserAccessDetailsResponse[0].GetSelfUserAccessDetailsResult[0];

			var total = [];

			var creatorFolders = resp.FoldersWithCreatorAccess[0].guid
			if(creatorFolders){
				total = _setConcat(total,creatorFolders);
			}
			console.log(total);

			var groups = resp.GroupMembershipAccess[0].GroupAccessDetails;
			_.forEach(groups,function(group){
				var creatorFs = group.FoldersWithCreatorAccess[0].guid;
				if(creatorFs){
					total = _setConcat(total,creatorFs);
				}
			});

			params.folderIds = total;

			ep.SessionManagement.GetFoldersById(params,options,function(err,response){
				if(err){
					return cb(err);
				}

				var folders = response[0].GetFoldersByIdResponse[0].GetFoldersByIdResult[0].Folder;
				var results = [];
				_.forEach(folders,function(folder){
					results.push(_extractFolder(folder));
				});
				cb(null,results);
			});

		});
	}

	function getCollectionDetails(collectionId,inputUser,cb){
		var params = {
			folderIds:[collectionId]
		}
		var options = {};

		_determineAuth(inputUser,params,options);

		ep.SessionManagement.GetFoldersById(params,options,function(err,response){
			if(err){
				return cb(err);
			}

			var folder = response[0].GetFoldersByIdResponse[0].GetFoldersByIdResult[0].Folder[0];
			var result =  _extractFolder(folder);

			return cb(null,result);
		});


	}

	//TODO: validate IDs (format - stop xml injection)
	function getCollectionContents(collectionId,cb){
		var params = {
			auth:proxyAuthViewer,
			folderIds:[collectionId]
		}
		var options = {};

		ep.SessionManagement.GetFoldersById(params,options,function(err,response){
			if(err){
				return cb(err);
			}

			var folder = response[0].GetFoldersByIdResponse[0].GetFoldersByIdResult[0].Folder[0];

			var params = {
				auth:proxyAuthViewer,
				request:{
					folderId:collectionId,
					states:{
						sessionState:"Complete"
					}
				}
			}

			
			ep.SessionManagement.GetSessionsList(params,{},function(err,response){
				if(err){
					return cb(err);
				}

				var sessionResults = [];

				var sessions = response[0].GetSessionsListResponse[0].GetSessionsListResult[0].Results[0].Session;
				_.forEach(sessions,function(session){
					sessionResults.push(_extractSession(session));
				});

				var folderResult = _extractFolder(folder);
				folderResult.recordings = sessionResults;
			
				cb(null,folderResult);
			});

		});

	}

	function _extractFolder(folder){
		var result = {
			inputId : folder.Id[0],
			name : folder.Name[0],
			description : folder.Description[0],
		};
		return result;
	}

	function _extractSession(session){
		var complete = session.State[0] === "Complete";
		var result = {
			inputId : session.Id[0],
			name : session.Name[0],
			description : session.Description[0],
			creatorId : session.CreatorId[0],
			creatorUsername : null,
			collection:{
				inputId:session.FolderId[0],
				name:session.FolderName[0]
			},
			mp3 : session.MP3Url[0],
			mp4 : session.MP4Url[0],
			startTime : session.StartTime[0],
			duration : session.Duration[0],
			thumbUrl : session.ThumbUrl[0],
			complete : complete
		};

		return result;
	}

	function _extractUser(user){
		var result = {
			inputId : user.UserId[0],
			userKey : user.UserKey[0],
			firstName : user.FirstName[0],
			lastName : user.LastName[0]
		}
	}

	function _setConcat(current,additions){
		var fresh = _.difference(additions, current);
		return current.concat(fresh);

	}


	function trackCollection(collectionId,inputUser,cb){

		var CREATOR = "Creator";
		var VIEWER = "Viewer";

		var usersToAdd = [
			{role:VIEWER,auth:proxyAuthViewer},
		];

		if(creatorProxy){
			usersToAdd.push({role:CREATOR,auth:proxyAuthCreator});
		}

		latestAsync.each(usersToAdd, function(user,callback){
			var params = {
				auth:user.auth
			};
			var options = {};

			ep.AccessManagement.GetSelfUserAccessDetails(params,options,function(err,response){
				if(err){
					return cb(err);
				}

				var resp = response[0].GetSelfUserAccessDetailsResponse[0].GetSelfUserAccessDetailsResult[0];

				var guid = resp.UserId[0];

				var total = [];
				var creatorFolders = resp.FoldersWithCreatorAccess[0].guid;
				var viewerFolders = resp.FoldersWithViewerAccess[0].guid;

				if(creatorFolders){
					total = _setConcat(total,creatorFolders);
				}

				if(viewerFolders){
					total = _setConcat(total,viewerFolders);
				}

				if(_.includes(total,collectionId)){
					return cb(null,false);
				}else{

					var params = {
						folderId:collectionId,
						userIds:[guid],
						role:user.role
					}
					var options = {};
					_determineAuth(inputUser,params,options);

					ep.AccessManagement.GrantUsersAccessToFolder(params,options,function(err,response){
						if(err){
							cb(err);
						}else{
							cb(null,true);
						}
					});

				}

			});

		},
		function(err){
			if(err){
				return cb(err);
			}
			return cb(null,true);
		});

		

	}

	function canViewByCollection(inputRecordings,inputUser,cb){
		_.forEach(inputRecordings,function(rec){
			rec.canView = false;
		});

		var output = [];

		_getCollectionAccess(inputUser,true,function(err,collectionIds){
			if(err){
				return cb(err);
			}

			_.forEach(inputRecordings,function(rec){
				if(_.includes(collectionIds,rec.collection)){
					rec.canView = true;
					output.push(rec);
				}
				
			});

			cb(null,output);
		});
	}

	function canViewByRecording(inputRecordings,inputUser,cb){
		_.forEach(inputRecordings,function(rec){
			rec.canView = false;
		});

		var byCollection = _.groupBy(inputRecordings,'collection.inputId');
		var output = [];

		latestAsync.forEachOf(byCollection, function (recordings, collectionId, callback) {

			var params = {
				request:{
					folderId:collectionId,
					states:{
						sessionState:"Complete"
					}
				}
			}
			var options = {};

			_determineAuth(inputUser,params,options);
			
			ep.SessionManagement.GetSessionsList(params,options,function(err,response){
				if(err){
					return callback(null,false);
				}

				var sessionIds = [];

				var sessions = response[0].GetSessionsListResponse[0].GetSessionsListResult[0].Results[0].Session;
				_.forEach(sessions,function(session){
					sessionIds.push(session.Id[0]);
				});

				_.forEach(recordings,function(rec){
					if(_.includes(sessionIds,rec.inputId)){
						rec.canView = true;
						output.push(rec);
					}
				});

				callback(null,true);
			});
		  
		}, function (err) {
		  if (err){
		  	return cb(err);
		  }
		  
		  cb(null,output);
		});
	}

	function _generateAuthCode(inputUser){
		return panopto.util.generateAuthCode(inputUser,externalConfig.server_base,externalConfig.secret);
	}

	
	function _getCollectionAccess(inputUser, viewer, cb){
		var params = {};
		var options = {};
		_determineAuth(inputUser,params,options);

		ep.AccessManagement.GetSelfUserAccessDetails(params,options,function(err,response){
			if(err){
				return cb(err);
			}

			var resp =  response[0].GetSelfUserAccessDetailsResponse[0].GetSelfUserAccessDetailsResult[0];

			var total = [];

			var creatorFolders = resp.FoldersWithCreatorAccess[0].guid
			if(creatorFolders){
				total = _setConcat(total,creatorFolders);
			}

			var viewerFolders = resp.FoldersViewerCreatorAccess[0].guid
			if(viewer && viewerFolders){
				total = _setConcat(total,viewerFolders);
			}

			var groups = resp.GroupMembershipAccess[0].GroupAccessDetails;
			_.forEach(groups,function(group){
				var creatorFs = group.FoldersWithCreatorAccess[0].guid;
				if(creatorFs){
					total = _setConcat(total,creatorFs);
				}

				var viewerFs = group.FoldersWithViewerAccess[0].guid;
				if(viewer && viewerFs){
					total = _setConcat(total,viewerFs);
				}
			});

			cb(null,total);

		});
	}
	



	return {
		trackCollection : trackCollection,
		getCollectionContents : getCollectionContents,
		getCollectionDetails : getCollectionDetails,
		canViewByRecording : canViewByRecording,
		canViewByCollection : canViewByCollection,
		getUserCreatorCollections : getUserCreatorCollections,
		getUserDetails : getUserDetails,
		uploadTranscript : uploadTranscript,
		config : internalConfig,
		init : init
	}

}