

module.exports = {

  attributes: {
    inputId : {
      type:"string",
      required:true
    },
    name : {
      type:"string"
    },
    description : {
      type:"string"
    },
    knownRecordings : {
      type : "array",
      defaultsTo : []
    },
  	courses : {
      collection: 'Course',
      via: 'collections'
    },
    lastCheckError : {
      type : "boolean",
      defaultsTo : false
    },
    importedRecordings : {
      collection: 'Recording',
      via: 'collection'
    }
  }

};

