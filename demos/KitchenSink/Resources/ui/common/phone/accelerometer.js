function accelerometer(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	var accelerometerAdded = false;
	
	var x = Titanium.UI.createLabel({
		text:'x:',
		top:10,
		left:10,
		font:{fontSize:14},
		color:'#555',
		width:300,
		height:Ti.UI.SIZE
	});
	win.add(x);
	
	var y = Titanium.UI.createLabel({
		text:'y:',
		top:30,
		left:10,
		font:{fontSize:14},
		color:'#555',
		width:300,
		height:Ti.UI.SIZE
	});
	win.add(y);
	
	var z = Titanium.UI.createLabel({
		text:'z:',
		top:50,
		left:10,
		font:{fontSize:14},
		color:'#555',
		width:300,
		height:Ti.UI.SIZE
	});
	win.add(z);
	
	var ts = Titanium.UI.createLabel({
		text:'timestamp:',
		top:70,
		left:10,
		font:{fontSize:14},
		color:'#555',
		width:300,
		height:Ti.UI.SIZE
	});
	win.add(ts);
	
	var accelerometerCallback = function(e) {
		ts.text = e.timestamp;
		x.text = 'x: ' + e.x;
		y.text = 'y:' + e.y;
		z.text = 'z:' + e.z;
	};
	
	Ti.Accelerometer.addEventListener('update', accelerometerCallback);
	accelerometerAdded = true;
	
	if (Titanium.Platform.name == 'iPhone OS' && Titanium.Platform.model == 'Simulator')
	{
		var notice = Titanium.UI.createLabel({
			bottom:50,
			font:{fontSize:18},
			color:'#900',
			width:Ti.UI.SIZE,
			text:'Note: Accelerometer does not work in simulator',
			textAlign:'center'
		});
		win.add(notice);
	}
	
	if (Titanium.Platform.name === 'android')
	{
		win.addEventListener('open', function(e) {
			win.activity.addEventListener('pause', function(e) {
				if (accelerometerAdded) {
					Ti.API.info("removing accelerometer callback on pause");
					Ti.Accelerometer.removeEventListener('update', accelerometerCallback);
				}
			});
			win.activity.addEventListener('resume', function(e) {
				if (accelerometerAdded) {
					Ti.API.info("adding accelerometer callback on resume");
					Ti.Accelerometer.addEventListener('update', accelerometerCallback);
				}
			});
		});
	}
	return win;
};

module.exports = accelerometer;