var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var label = Ti.UI.createLabel({
	text: '1. Rotate your device 90 degrees.\n 2. Shake your device',
	fontSize: 20,
	top: 40,
	left: 10,
	width:300,
	height: 100
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:140,
	fontSize: 16,
	top:200,
	left:90
});

closeButton.addEventListener('click', function(){
	Ti.Gesture.removeEventListener('orientationchange',orientChange1);
	Ti.Gesture.removeEventListener('shake',shaking);
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);
win.add(label);
function orientChange1(e){
	var orientName = '';
	switch(e.orientation){
		case 1:{
		orientName = 'FACE_DOWN';
		break}
		case 2:{
		orientName = 'FACE_UP';
		break}
		case 3:{
		orientName = 'PORTRAIT';
		break}
		case 4:{
		orientName = 'UPSIDE_PORTRAIT';
		break}
		case 5:{
		orientName = 'LANDSCAPE_LEFT';
		break}
		case 6:{
		orientName = 'LANDCAPE_RIGHT';
		break}
	}
	
	alert('Your orientation is '+ orientName);
};

function shaking(){
	alert('You are shaking your device!');
};
Ti.Gesture.addEventListener('orientationchange',orientChange1);
Ti.Gesture.addEventListener('shake',shaking);
