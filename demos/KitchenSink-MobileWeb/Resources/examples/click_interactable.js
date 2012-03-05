var win = Ti.UI.currentWindow;

var clickEvent = Ti.UI.createButton({
	title: 'Click event',
	top: 10,
	left: 10,
	height: 40, 
	width: 100
});


var dblclickEvent = Ti.UI.createButton ({
	title: 'Dblclick event',
	top: 10,
	left: 115,
	height: 40, 
	width: 100
});

var focusEvent = Ti.UI.createButton ({
	title: 'Focus event',
	top: 55,
	left: 10,
	height: 40, 
	width: 100
});

var blurEvent = Ti.UI.createButton ({
	title: 'blur event',
	top: 55,
	left: 115,
	height: 40, 
	width: 100
});

var changeEvent = Ti.UI.createButton ({
	title: 'Change event',
	top: 100,
	left: 10,
	height: 40, 
	width: 100
});

var returnEvent = Ti.UI.createButton ({
	title: 'Return event',
	top: 100,
	left: 115,
	height: 40, 
	width: 100
});

win.add(clickEvent);
win.add(dblclickEvent);
win.add(focusEvent);
win.add(blurEvent);
win.add(changeEvent);
win.add(returnEvent);

var clickFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'click works!',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'green'
	});
	win.add(listenerLabel);
	setTimeout(function(){
		listenerLabel.hide();
	},1500);
};

var dblclickFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'DoubleClick works!',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'blue'
	});
	win.add(listenerLabel);
	setTimeout(function(){
	listenerLabel.hide();	
	},1500);
};


var focusFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'Focus event works',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
		listenerLabel.hide();
	},1500);
};

var blurFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'Blur event works',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
		listenerLabel.hide();
	},1500);
};

var changeFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'Change event works',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
		listenerLabel.hide();
	},1500);
};

var returnFunc = function(){
		var listenerLabel = Ti.UI.createLabel ({
		text: 'Return event works',
		color: '#FFF',
		top: 335,
		left: 70,
		width: 100,
		height: 50,
		backgroundColor: 'red'
	});
	win.add(listenerLabel);
	setTimeout(function(){
		listenerLabel.hide();
	},1500);
};


clickEvent.addEventListener('click', function(){
	object.addEventListener('click', clickFunc);
});

dblclickEvent.addEventListener('click', function(){
	object.addEventListener('dblclick', dblclickFunc);
});

focusEvent.addEventListener('click', function(){
	
	object.addEventListener('focus', focusFunc);
});

blurEvent.addEventListener('click', function(){
	object.addEventListener('blur', blurFunc);
});

changeEvent.addEventListener('click', function(){
	object.addEventListener('change', changeFunc);
});

returnEvent.addEventListener('click', function(){
	object.addEventListener('return', returnFunc);
});

var textField = Ti.UI.createTextField ({
	value: 'textField',
	color: 'red',
	top: 230,
	left: 70,
	width: 100,
	height: 100
});

var textArea = Ti.UI.createTextArea ({
	value: 'textArea',
	color: 'red',
	top: 230,
	left: 70,
	width: 100,
	height: 100
});

var button = Ti.UI.createButton({
	title: 'Button',
	top: 230,
	left: 70,
	width: 100,
	height: 50
});

var label = Ti.UI.createLabel({
	text: 'Label',
	backgroundColor: 'green',
	top: 230,
	left: 70,
	width: 100,
	height: 100
});

var object = textArea;
win.add(object);

