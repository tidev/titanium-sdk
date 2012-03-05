var win = Ti.UI.currentWindow;

var singletapEvent = Ti.UI.createButton({
	title: 'singletap',
	top: 10,
	left: 10,
	height: 40, 
	width: 100
});


var doubletapEvent = Ti.UI.createButton ({
	title: 'doubletap',
	top: 10,
	left: 115,
	height: 40, 
	width: 100
});

var swipeEvent = Ti.UI.createButton ({
	title: 'swipe',
	top: 55,
	left: 10,
	height: 40, 
	width: 100
});

var touchcancelEvent = Ti.UI.createButton ({
	title: 'touchcancel',
	top: 55,
	left: 115,
	height: 40, 
	width: 100
});

var touchendEvent = Ti.UI.createButton ({
	title: 'touchend',
	top: 100,
	left: 10,
	height: 40, 
	width: 100
});

var touchmoveEvent = Ti.UI.createButton ({
	title: 'touchmove',
	top: 100,
	left: 115,
	height: 40, 
	width: 100
});

var touchstartEvent = Ti.UI.createButton ({
	title: 'touchstart',
	top: 145,
	left: 10,
	height: 40, 
	width: 100
});


var twofingertapEvent = Ti.UI.createButton ({
	title: 'twofingertap',
	top: 145,
	left: 115,
	height: 40, 
	width: 100
});


win.add(singletapEvent);
win.add(doubletapEvent);
win.add(swipeEvent);
win.add(touchcancelEvent);
win.add(touchendEvent);
win.add(touchmoveEvent);
win.add(touchstartEvent);
win.add(twofingertapEvent);

singletapFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'singletap works!',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'green'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

doubletapFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'doubletap works!',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'blue'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

swipeFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'swipe event works',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

touchcancelFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'touchcancel event works',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}
touchendFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'touchend event works',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},2500);
	
	}

touchmoveFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'touchmove event works',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

touchstartFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'touchstart event works',
		color: '#FFF',
		top: 230,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

twofingertapFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'twofingertap event works',
		color: '#FFF',
		top: 10,
		left: 140,
		width: 100,
		height: 100,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
	
	}

singletapEvent.addEventListener('click', function(){
	object.addEventListener('singletap', singletapFunc);
})

doubletapEvent.addEventListener('click', function(){
	object.addEventListener('doubletap', doubletapFunc);
})

swipeEvent.addEventListener('click', function(){
	
	object.addEventListener('swipe', swipeFunc);
})

touchcancelEvent.addEventListener('click', function(){
	object.addEventListener('touchcancel', touchcancelFunc);
})

touchendEvent.addEventListener('click', function(){
	object.addEventListener('touchend', touchendFunc);
})

touchmoveEvent.addEventListener('click', function(){
	object.addEventListener('touchmove', touchmoveFunc);
})

touchstartEvent.addEventListener('click', function(){
	object.addEventListener('touchstart', touchstartFunc);
})

twofingertapEvent.addEventListener('click', function(){
	object.addEventListener('twofingertap', twofingertapFunc);
})

var textField = Ti.UI.createTextField ({
	value: 'textField',
	color: 'red',
	top: 230,
	left: 30,
	width: 100,
	height: 100,
});

var textArea = Ti.UI.createTextArea ({
	value: 'textArea',
	color: 'red',
	top: 230,
	left: 30,
	width: 100,
	height: 100,
});

var button = Ti.UI.createButton({
	title: 'Button',
	top: 230,
	left: 30,
	width: 100,
	height: 50,
});

var label = Ti.UI.createLabel({
	text: 'Label',
	backgroundColor: 'green',
	top: 200,
	left: 10,
	width: 200,
	height: 120
})

	var object = label;
	win.add(object);
