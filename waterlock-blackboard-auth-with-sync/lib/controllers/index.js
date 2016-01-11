'use strict';

exports.login = require('./actions/login');
exports.logout = require('./actions/logout');

exports.extras = {
	blackboard_callback: require('./actions/blackboard_callback'),
	panopto_callback: require('./actions/panopto_callback'),
};