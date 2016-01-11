/**
 * User
 *
 * @module      :: Model
 * @description :: This is the base user model
 * @docs        :: http://waterlock.ninja/documentation
 */

module.exports = {

  attributes: require('waterlock').models.user.attributes({
    username:{
      type:"string"
    },
    //Password is not needed here
    //password: {
    //  type: "string",
    //  required: true
    //},
    firstname:{
      type: "string"
    },
    lastname:{
      type: "string"
    },
    email:{
      type: "email"
    },
    jsonWebTokens: {
      collection: 'jwt',
      via: 'owner'
    },
    enabled:{
      type:'boolean',
      defaultsTo:true
    },
    role:{
      type:"string",
      enum:['normal','admin','teacher'],
      defaultsTo:"normal" //could be admin, normal
    }

  }),
  
  beforeCreate: require('waterlock').models.user.beforeCreate,
  beforeUpdate: require('waterlock').models.user.beforeUpdate
};
