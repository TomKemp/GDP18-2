var _ = require("lodash");

module.exports.synoteconnect = {
    input:{
      "module":"synote-connect-panopto-input",
      "server_protocol":"https",
      "server_base":"coursecast.unviersity.ac.uk",
      "poll_rate":10,
      "proxy_account_viewer":{
        "UserKey":"viewer user",
        "Password":"viewer user"
      },
      "proxy_account_creator":{
        "UserKey":"creator user",
        "Password":"creator user"
      },
      "proxy_account_admin":{
        "UserKey":"creator user",
        "Password":"creator user"
      },
      "secret":"panopto key",
      interface_imp:function(input,output){
        return {
          getTrackedCollections : function(cb){
            Collection.find({}).exec(function(err,collections){
              if(err){
                return cb(err);
              }
              var results = [];
              _.forEach(collections,function(collection){
                var result = {
                  inputId : collection.inputId,
                  knownRecordings : collection.knownRecordings
                }
                results.push(result);
              });
              return cb(null,results);
            });
          },
          getTrackedCollection : function (collectionId,cb){
            Collection.findOne({inputId:collectionId}).exec(function(err,collection){
              if(err){
                return cb(err);
              }

              var result = {
                inputId : collection.inputId,
                knownRecordings : collection.knownRecordings
              }
              return cb(null,result);
            });
          },
          updateTrackedCollection : function (collectionId,arr,cb){
            Collection.findOne({inputId:collectionId}).exec(function(err,collection){
              if(err){
                return cb(err);
              }
            
              collection.knownRecordings = arr;
              collection.save(function(){
                cb(false,true);
              });
              
            });
          },
          convertFromInputUser : function(inputUser,cb){
            var index = inputUser.indexOf("\\");
            if(index == -1){
              return cb(inputUser);
            }else{
              return cb(inputUser.substring(index+1));
            }
          },
          convertToInputUser : function(synoteUser,cb){
            return cb({
              UserKey:"Blackboard\\"+synoteUser
            });
          }
        }
      },
      listeners:function(input,output){
        return {
          "recording.new":function(collectionId,recordings){
            console.log("New recording");

            Collection.findOne({ inputId: collectionId }).populate("courses").exec(function(err,collection){
              if(err){
                console.log("ERR1");
                return;
              }
              console.log("Found collection");


              _.forEach(collection.courses,function(course){
                console.log(course);

                _.forEach(recordings,function(recording){
                  recording.course = course.id;
                  recording.collection = collection.id;
                  recording.thumbUrl = "https://coursecast.university.ac.uk" + recording.thumbUrl;
                  Recording.create(recording).exec(function(){});
                  console.log("here");
                  input.uploadTranscript(recording.inputId,"1\n00:00:00,440 --> 00:00:10,375\ntest",function(err,success){
                    console.log("Upload transcript");
                    console.log(err);
                    console.log(success);
                  });

                });

              });

            });

          },
          "polling.success":function(collectionId){
            console.log("success");
            Collection.findOne({ inputId: collectionId }).exec(function(err,collection){
              if(err){
                return;
              }

              if(collection.lastCheckError){
                collection.lastCheckError = false;
                collection.save();
              }

            });
          },
          "polling.error":function(collectionId){
            console.log("error");
            Collection.findOne({ inputId: collectionId }).exec(function(err,collection){
              if(err){
                return;
              }

              if(!collection.lastCheckError){
                collection.lastCheckError = true;
                collection.save();
              }

            });
          },
          "recording.removed":function(collectionId,recordings){
            console.log("Removed!");
            console.log(collectionId);
            console.log(recordings);
          }
        }
      }

    },
    output:{
      "module":"synote-connect-blackboard-output",
      "building_block_path":"https://blackboard.university.ac.uk/.../",
      "secret":"blackboard key",
      "service_name":"Synote",
      "alert_students_endpoint":"/alert.php",
      interface_imp:function(input,output){
        return{
          getCourseContents : function(courseId,user,cb){
           Course.findOne({ outputId: courseId }).populate("recordings").exec(function(err,course){
            if(err){
              return cb(err);
            }

            console.log("course");
            console.log(course);

            if(!course){
              console.log("NULL");
              return cb(null,null);
            }
            Recording.find({course:course.id}).populate("collection").populate("course").exec(function(err,recordings){
              if(err){
                return cb(err);
              }

              var result = [];
              _.forEach(recordings,function(recording){
                var rec = _extractRecording(recording);
                rec.synoteURL = "http://localhost:1337/recording/" + recording.id;
              
                result.push(rec);
              });

              cb(null,result);


            });

           });

          },
          configureCourse : function(details,user,cb){

            Course.create(details).exec(function(err){
              if(err){
                return cb(err);
              }

              return cb(null,true)

            });
          },
          getMappings : function(courseId,user,cb){
            Course.findOne({outputId:courseId}).populate("collections").exec(function(err,course){
              if(err){
                return cb(err);
              }

              if(!course){
                return cb(null,null);
              }

              var results = [];
              _.forEach(course.collections,function(collection){
                var col = _extractCollection(collection)
                results.push(col);
              });

              cb(null,results);

            });
          },
          convertFromOutputUser : function(outputUser,cb){
            return cb(outputUser);
          },
          convertToOutputUser : function(synoteUser,cb){
            return cb(synoteUser);
          },
          isSuggestedCollection : function(collection,courseId){
            return collection.name.indexOf(courseId) !== -1;
          },
          createMapping : function(courseId,collectionDetails,user,cb){
            Course.findOne({outputId:courseId}).exec(function(err,course){
              if(err){
                return cb(err);
              }
              if(!course){
                return cb("Course not found");
              }

              Collection.findOne({inputId:collectionDetails.inputId}).exec(function(err,collection){
                if(err){
                  return cb(err);
                }

                if(collection){
                  course.collections.add(collection.id);
                }else{
                  course.collections.add(collectionDetails);

                }
                course.save(function(err){
                  if(err){
                    return cb(err);
                  }

                  return cb(null,true);
                });
                
              });


            });

          },
          deleteMapping : function(courseId,collectionId,user,cb){
            Course.findOne({outputId:courseId}).exec(function(err,course){
              if(err){
                return cb(err);
              }
              if(!course){
                return cb("Course not found");
              }

              Collection.findOne({inputId:collectionId}).exec(function(err,collection){
                if(err){
                  return cb(err);
                }

                if(collection){
                  course.collections.remove(collection.id);
                }
                course.save(function(err){
                  if(err){
                    return cb(err);
                  }

                  return cb(null,true);
                });
                
              });


            });

          }

        }
      }
    },
    util:function(input,output){
      return {
        canViewRecordings:function(recordings,synoteUser,cb){
         input.canViewByRecording(recordings,synoteUser,cb);
        }
      }
    }
};




function _extractRecording(recording){

  var result = _.pick(recording, [
      "id",
      "inputId",
      "name",
      "description",
      "creatorId",
      "creatorUsername",
      "mp3",
      "mp4",
      "startTime",
      "duration",
      "thumbUrl",
      "complete",
    ]);
  result.collection = _.pick(recording.collection,[
    'id',
    'inputId',
    'name'
  ]);
  return result;
}

function _extractCollection(collection){
  return _.pick(collection, [
      "id",
      "inputId",
      "name",
      "description"
    ]);
}