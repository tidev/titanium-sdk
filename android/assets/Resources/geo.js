//var win = Titanium.UI.currentWindow;
var win = Ti.UI.createWindow({backgroundColor : 'rgba(216,216,216,216)'});

var currentHeadingLabel = Titanium.UI.createLabel({
	title:'Current Heading (One Shot)',
	font:{fontFamily : 'serif', fontSize:"12", fontWeight:'bold'},
	color:'#111',
	top:10,
	left:10,
	height:15,
	width:300
});
currentHeadingLabel.text = 'Current Heading (One Shot)';
win.add(currentHeadingLabel);

var currentHeading = Titanium.UI.createLabel({
	title:'Updated Heading not fired',
	font:{fontSize:12},
	color:'#444',
	top:30,
	left:10,
	height:15,
	width:300
});
win.add(currentHeading);

var updatedHeadingLabel = Titanium.UI.createLabel({
	title:'Updated Heading',
	font:{fontFamily : 'sans-serif', fontSize:12, fontWeight:'bold'},
	color:'#111',
	top:50,
	left:10,
	height:15,
	width:300
});
updatedHeadingLabel.text = 'Updated Heading';
win.add(updatedHeadingLabel);

var updatedHeading = Titanium.UI.createLabel({
	title:'Updated Heading not fired',
	font:{fontSize:12},
	color:'#444',
	top:70,
	left:10,
	height:15,
	width:300
});
win.add(updatedHeading);

var updatedHeadingTime = Titanium.UI.createLabel({
	title:'',
	font:{fontSize:11},
	color:'#444',
	top:90,
	left:10,
	height:15,
	width:300
});
win.add(updatedHeadingTime);

var currentLocationLabel = Titanium.UI.createLabel({
	title:'Current Location (One Shot)',
	font:{fontFamily : 'monospace', fontSize:12, fontWeight:'bold'},
	color:'#111',
	top:110,
	left:10,
	height:15,
	width:300
});
currentLocationLabel.text = 'Current Location (One Shot)';
win.add(currentLocationLabel);

var currentLocation = Titanium.UI.createLabel({
	title:'Current Location not fired',
	font:{fontSize:11},
	color:'#444',
	top:130,
	left:10,
	height:15,
	width:300
});
win.add(currentLocation);

var updatedLocationLabel = Titanium.UI.createLabel({
	title:'Updated Location',
	font:{fontSize:12, fontWeight:'bold'},
	color:'#111',
	top:150,
	left:10,
	height:15,
	width:300
});
updatedLocationLabel.text = 'Updated Location';
win.add(updatedLocationLabel);

var updatedLocation = Titanium.UI.createLabel({
	title:'Updated Location not fired',
	font:{fontSize:11},
	color:'#444',
	top:170,
	left:10,
	height:15,
	width:300
});
win.add(updatedLocation);

var updatedLatitude = Titanium.UI.createLabel({
	title:'',
	font:{fontSize:11},
	color:'#444',
	top:190,
	left:10,
	height:15,
	width:300
});
win.add(updatedLatitude);

var updatedLocationAccuracy = Titanium.UI.createLabel({
	title:'',
	font:{fontSize:11},
	color:'#444',
	top:210,
	left:10,
	height:15,
	width:300
});
win.add(updatedLocationAccuracy);

var updatedLocationTime = Titanium.UI.createLabel({
	title:'',
	font:{fontSize:11},
	color:'#444',
	top:230,
	left:10,
	height:15,
	width:300
});
win.add(updatedLocationTime);

win.open();

//
//  SHOW CUSTOM ALERT IF DEVICE HAS GEO TURNED OFF
//
if (Titanium.Geolocation.locationServicesEnabled==false)
{
	Titanium.UI.createAlertDialog({title:'Kitchen Sink', message:'Your device has geo turned off - turn it on.'}).show();
}
else
{
	//
	// IF WE HAVE COMPASS GET THE HEADING
	//
	if (Titanium.Geolocation.hasCompass)
	{
		//
		//  TURN OFF ANNOYING COMPASS INTERFERENCE MESSAGE
		//
		Titanium.Geolocation.showCalibration = false;

		//
		// SET THE HEADING FILTER (THIS IS IN DEGREES OF ANGLE CHANGE)
		// EVENT WON'T FIRE UNLESS ANGLE CHANGE EXCEEDS THIS VALUE
		Titanium.Geolocation.headingFilter = 5;

		//
		//  GET CURRENT HEADING - THIS FIRES ONCE
		//
		Ti.Geolocation.getCurrentHeading(function(e)
		{
			var x = e.heading.x;
			var y = e.heading.y;
			var z = e.heading.z;
			var magneticHeading = e.heading.magneticHeading;
			var accuracy = e.heading.accuracy;
			var trueHeading = e.heading.trueHeading;
			var timestamp = e.heading.timestamp;

			currentHeading.text = 'x:' + x + ' y: ' + y + ' z:' + z;
			Titanium.API.info('geo - current heading: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
		});

		//
		// EVENT LISTENER FOR COMPASS EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON HEADING FILTER)
		//
		Titanium.Geolocation.addEventListener('heading',function(e)
		{
			var x = e.heading.x;
			var y = e.heading.y;
			var z = e.heading.z;
			var magneticHeading = e.heading.magneticHeading;
			var accuracy = e.heading.accuracy;
			var trueHeading = e.heading.trueHeading;
			var timestamp = e.heading.timestamp;

			//updatedHeading.text = 'x:' + x + ' y: ' + y + ' z:' + z;
			updatedHeading.text = 'mag: ' + magneticHeading + " true: " + trueHeading;
			updatedHeadingTime.text = 'timestamp:' + new Date(timestamp);
//			updatedHeading.color = 'red';
//			updatedHeadingTime.color = 'red';
//			setTimeout(function()
//			{
//				updatedHeading.color = '#444';
//				updatedHeadingTime.color = '#444';
//
//			},100);

			Titanium.API.info('geo - heading updated: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
		});
	}
	else
	{
		Titanium.API.info("No Compass on device");
	}

	//
	//  SET ACCURACY - THE FOLLOWING VALUES ARE SUPPORTED
	//
	// Titanium.Geolocation.ACCURACY_BEST
	// Titanium.Geolocation.ACCURACY_NEAREST_TEN_METERS
	// Titanium.Geolocation.ACCURACY_HUNDRED_METERS
	// Titanium.Geolocation.ACCURACY_KILOMETER
	// Titanium.Geolocation.ACCURACY_THREE_KILOMETERS
	//
	Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;

	//
	//  SET DISTANCE FILTER.  THIS DICTATES HOW OFTEN AN EVENT FIRES BASED ON THE DISTANCE THE DEVICE MOVES
	//  THIS VALUE IS IN METERS
	//
	Titanium.Geolocation.distanceFilter = 1;

	//
	// GET CURRENT POSITION - THIS FIRES ONCE
	//
	Titanium.Geolocation.getCurrentPosition(function(e)
	{
		var longitude = e.coords.longitude;
		var latitude = e.coords.latitude;
		var altitude = e.coords.altitude;
		var heading = e.coords.heading;
		var accuracy = e.coords.accuracy;
		var speed = e.coords.speed;
		var timestamp = e.coords.timestamp;
		var altitudeAccuracy = e.coords.altitudeAccuracy;

		currentLocation.text = 'long:' + longitude + ' lat: ' + latitude;

		Titanium.API.info('geo - current location: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	//
	// EVENT LISTENER FOR GEO EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON DISTANCE FILTER)
	//
	Titanium.Geolocation.addEventListener('location',function(e)
	{
		if (e.error) {
			updatedLocation.text = 'error: ' + e.error.message
			return;
		} else {
			updatedLocation.text = '';
		}

		var longitude = e.coords.longitude;
		var latitude = e.coords.latitude;
		var altitude = e.coords.altitude;
		var heading = e.coords.heading;
		var accuracy = e.coords.accuracy;
		var speed = e.coords.speed;
		var timestamp = e.coords.timestamp;
		var altitudeAccuracy = e.coords.altitudeAccuracy;

		updatedLocation.text = 'long: ' + longitude;
		updatedLatitude.text = 'lat: '+ latitude;
		updatedLocationAccuracy.text = 'accuracy: ' + accuracy;
		updatedLocationTime.text = 'timestamp: ' + new Date(timestamp);

//		updatedLatitude.color = 'red';
//		updatedLocation.color = 'red';
//		updatedLocationAccuracy.color = 'red';
//		updatedLocationTime.color = 'red';
//		setTimeout(function()
//		{
//			updatedLatitude.color = '#444';
//			updatedLocation.color = '#444';
//			updatedLocationAccuracy.color = '#444';
//			updatedLocationTime.color = '#444';
//
//		},100);

		Titanium.API.info('geo - location updated: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});
}
