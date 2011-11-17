var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

Titanium.include('/examples/my_js_include.js', '/examples/my_js_include_2.js');

var button = Ti.UI.createButton({
	top: 10,
	left: 10,
	width: 300,
	height: 40,
	title: 'Show included data' 
});

win.add(button);

button.addEventListener('click',function(){
Ti.UI.createAlertDialog({
	title:'JS Includes',
	message:'first name: ' + myFirstName + ' last name: ' + myLastName 
}).show();
	
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	fontSize: 16,
	top:70,
	left:10
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);
