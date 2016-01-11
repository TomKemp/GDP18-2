'use strict';

var _ = require('lodash');

exports.attributes = function(attr){
  var auth = {
    username: {
      type: 'string',
      unique:true
    },
    provider: {
      type: 'string'
    },
    blackboard_id: {
      type: 'string'
    },
    email:{
      type: 'email'
    },
    firstname:{
      type: 'string'
    }
    ,
    surname:{
      type: 'string'
    }
  };

  _.merge(auth, attr);
  _.merge(attr, auth);
};
