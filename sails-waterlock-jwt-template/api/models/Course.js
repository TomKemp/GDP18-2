

module.exports = {

  attributes: {
  	outputId : {
  		type:"string",
  		required:true
  	},
    name : {
      type:"string"
    },
    description : {
      type:"string"
    },
  	collections : {
  		collection: 'Collection',
      	via: 'courses' 
  	},
  	recordings : {
  		collection: 'Recording',
      	via: 'course' 
  	}
  }

};

