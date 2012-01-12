exports.counter=0;
exports.increment=function(){
	exports.counter++; 
	Ti.API.debug('Counter increment called, counter is now '+exports.counter);
	return exports.counter;
};
