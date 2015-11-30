function app_events(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title,
		navBarHidden:true
	});

	var view = Titanium.UI.createView({
	  top: 20,
	  width:Ti.UI.FILL,
	  height: Ti.UI.FILL,
	  layout:'vertical'
	});
	win.add(view);

	var label = Ti.UI.createLabel({
		text:'No app event received. Make call while running app',
		textAlign:'center',
		width:Ti.UI.SIZE
	});

	view.add(label);

	var paused = false;

	function pauseResponse(e){
		Ti.API.info("PAUSED");
		paused = true;
		label.text = "App has been paused";
	}
	Titanium.App.addEventListener('pause', pauseResponse);

	function resumeResponse(e){
		Titanium.API.info("RESUMED");
		if (paused)
		{
			label.text = "App has resumed";
		}
		else
		{
			label.text = "App has resumed (w/o pause)";
		}
	}

	Titanium.App.addEventListener('resume', resumeResponse);

	win.addEventListener('close', function(e){
		Titanium.API.info('Removing `paused` and `resume` events.');
		Titanium.App.removeEventListener('pause',pauseResponse);
		Titanium.App.removeEventListener('resume',resumeResponse);
	});


	if(Titanium.Platform.name == 'iPhone OS'){
		var timeLabel = Ti.UI.createLabel({
			top:50,
			text:'No Time Change event, received. Try Changing the devices time zone (Setting > General > Date & Time> TimeZone',
			textAlign:'center',
			width:Ti.UI.SIZE
		});
		view.add(timeLabel)

		function timeChanged(){
			Ti.API.info("Time Change Event Received !! ");
			timeLabel.text = "Time Change event received.";
		}

		Titanium.App.addEventListener('significanttimechange', timeChanged);

		win.addEventListener('close',function(){
			Titanium.API.info('Removing `significanttimechange` event.');
			Titanium.App.removeEventListener('significanttimechange',timeChanged);
		});
	 }

	if (Titanium.Platform.name == 'android') {
		win.addEventListener('open', function() {
			win.activity.addEventListener('pause', function(e) {
				Ti.API.info("pause event received");
				paused = true;
				label.text = "App has been paused";
			});
			win.activity.addEventListener('resume', function(e) {
				Ti.API.info("resume event received");
				if (paused) {
					label.text = "App has resumed";
				} else {
					label.text = "App has resumed (w/o pause)";
				}
			});
		});
	}

	return win;
};

module.exports = app_events;