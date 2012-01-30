var win = Titanium.UI.currentWindow;
win.backgroundColor = '#fff';

function locationCallback(e){
	if (!e.success || e.error) {
		l.text = 'error: ' + e.error + ' code ' + e.code
		return;
	}

	var longitude = e.coords.longitude;
	var latitude = e.coords.latitude;
	var altitude = e.coords.altitude;
	var heading = e.coords.heading;
	var accuracy = e.coords.accuracy;
	var speed = e.coords.speed;
	var timestamp = e.coords.timestamp;
	var altitudeAccuracy = e.coords.altitudeAccuracy;
	l.text = ' long: ' + longitude + '\n lat: ' + latitude + '\n alt: ' + altitude + '\n heading: ' + heading + '\n accuracy: ' + accuracy + '\n speed: ' + speed + '\n timestamp: ' + timestamp + '\n altitude accuracy: ' + altitudeAccuracy;
}

Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;

var l = Ti.UI.createLabel({
	font:{fontSize:14},
	color:'#000',
	top:10,
	left:10,
	height:190,
	width:300
});
Ti.UI.currentWindow.add(l);

var currentPosButton = Ti.UI.createButton({
	title:'Get Current Position',
	height:40,
	top:200,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(currentPosButton);


currentPosButton.addEventListener('click', function() {
	l.text = '';
	Titanium.Geolocation.getCurrentPosition(locationCallback);

});

/*

var updatePosButton = Ti.UI.createButton({
	title:'Update Current Position',
	height:40,
	top:140,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(updatePosButton);


updatePosButton.addEventListener('click', function() {
	l.text = '';
	Titanium.Geolocation.addEventListener('location', locationCallback);

});

var removeWatch = Ti.UI.createButton({
	title:'Remove Listener',
	height:40,
	top:190,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(removeWatch);


removeWatch.addEventListener('click', function() {
	l.text = 'listener removed';
	Titanium.Geolocation.removeEventListener('location', locationCallback);

});

*/

var close = Ti.UI.createButton({
	title:'Close',
	height:40,
	top:250,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(close);
	
close.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
