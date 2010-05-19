var settingsWindow = Ti.UI.createWindow({
	modal:true
});

var settings = {
	success:function(success)
	{
		if (!settings.autohide) {
			Ti.API.log("You didn't autohide me!");
			Ti.Media.hideMusicLibrary();
		}
	},
	error:function(error)
	{
		// create alert
		var a = Titanium.UI.createAlertDialog({title:'Music Picker'});

		// set message
		if (error.code == Titanium.Media.NO_MUSIC_PLAYER)
		{
			a.setMessage('Please run this test on device');
		}
		else
		{
			a.setMessage('Unexpected error: ' + error.code);
		}

		// show alert
		a.show();
	},
	mediaTypes:Ti.Media.MUSIC_MEDIA_TYPE_ALL
};

var modify = function(e) {
	Ti.API.log('Changing setting '+e.source.toggle+': '+e.source.value);
	settings[e.source.toggle] = e.source.value;
};

var v1 = Ti.UI.createView({
	top:10,
	left:10,
	width:250,
	height:30
});
var l1 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Autohide: '
});
var s1 = Ti.UI.createSwitch({
	value:true,
	right:10,
	top:0,
	toggle:'autohide'
});
s1.addEventListener('change', modify);
v1.add(l1);
v1.add(s1);
settingsWindow.add(v1);

var v2 = Ti.UI.createView({
	top:45,
	left:10,
	width:250,
	height:30
});
var l2 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Animated: '
});
var s2 = Ti.UI.createSwitch({
	value:true,
	top:0,
	right:10,
	toggle:'animated'
});
s2.addEventListener('change', modify);
v2.add(l2);
v2.add(s2);
settingsWindow.add(v2);

var v3 = Ti.UI.createView({
	top:80,
	left:10,
	width:250,
	height:30
});
var l3 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Multiple: '
});
var s3 = Ti.UI.createSwitch({
	value:false,
	top:0,
	right:10,
	toggle:'allowMultipleSelections'
});
s3.addEventListener('change', modify);
v3.add(l3);
v3.add(s3);
settingsWindow.add(v3);

var switches = [];
for (var i=0; i < 5; i++) {
	var baseTop = 115;
	var v = Ti.UI.createView({
		top:baseTop+i*35,
		left:10,
		width:250,
		height:30
	});
	
	var text;
	var type;
	switch (i) {
		case 0:
			text = 'Music:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_MUSIC;
			break;
		case 1:
			text = 'Podcasts:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_PODCAST;
			break;
		case 2:
			text = 'Audiobooks:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_AUDIOBOOK;
			break;
		case 3:
			text = 'Any audio:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_ANY_AUDIO;
			break;
		case 4:
			text = 'All:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_ALL;
			break;
	}
	
	var l = Ti.UI.createLabel({
		top:0,
		left:0,
		text:text
	});
	var s = Ti.UI.createSwitch({
		value:false,
		top:0,
		right:10,
		index:i,
		type:type
	});
	if (i == 4) {
		s.value = true;
	}
	
	s.addEventListener('change', function(e) {
		var type = e.source.type;
		var index = e.source.index;
		
		Ti.API.log('Setting media type: '+type+' to '+e.source.value);
		
		if (e.source.value) {
			settings.mediaTypes |= type;
		}
		else {
			settings.mediaTypes ^= type;
			for (var i=0; i < 5; i++) {
				if (index != i && switches[i].value) {
					settings.mediaTypes |= switches[i].type;
				}
			}
		}
	});
	switches.push(s);
	
	v.add(l);
	v.add(s);
	settingsWindow.add(v);
}

var showButton = Ti.UI.createButton({
	title:'Show library picker',
	width:200,
	height:40,
	bottom:10
});
settingsWindow.add(showButton);

showButton.addEventListener('click', function() {
	Ti.Media.openMusicLibrary(settings);
});