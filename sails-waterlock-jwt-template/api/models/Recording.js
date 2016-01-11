

module.exports = {

  attributes: {
    inputId : {
      type:"string",
      required:true
    },
    collection : {
      model:"Collection",
    },
  	mp4 : {
  		type:"string"
  	},
  	name : {
  		type:"string"
  	},
  	description : {
  		type : "string"
  	},
    course : {
      model:"Course"
    }
  }

};

