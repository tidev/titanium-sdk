'use strict';

module.exports = (done) => {
	Ti.API.debug('Hello from background task');
	done();
};
