module.exports.appendQuery = function(url,addition){
	if(url.indexOf('?') !== -1){
		return url + "&" + addition;
	}else{
		return url + "?" + addition;
	}
}