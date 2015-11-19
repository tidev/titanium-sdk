function progressbar(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	var value = 0;
	var ind, ind2, ind3, ind4, button, flexSpace, interval;
	var osname = Ti.Platform.osname;
	var isIos = osname === 'iphone' || osname === 'ipad';
	var sdkVersion = parseFloat(Ti.version);

	if (osname === 'android' && sdkVersion < 3.0) {
		win.title = 'Starting...';
		ind = Titanium.UI.createActivityIndicator({
			location : Titanium.UI.ActivityIndicator.DIALOG,
			type : Titanium.UI.ActivityIndicator.DETERMINANT,
			message : 'Downloading 0 of 10',
			min : 0,
			max : 10,
			value : 0
		});

		win.addEventListener('open', function(e) {
			ind.show();

			interval = setInterval(function() {
				value += 2;
				ind.setValue(value);
				ind.setMessage('Downloading ' + value + ' of 10');
				if (value >= 10) {
					clearInterval(interval);
					ind.hide();
					win.setTitle('Progress Bar');
				}
			}, 1000);
		});
	} else {
		button = Titanium.UI.createButton({
			title : 'Start Progress',
			height : 40,
			width : 200,
			top : 10
		});
		ind = Titanium.UI.createProgressBar({
			width : 150,
			min : 0,
			max : 10,
			value : 0,
			height : 70,
			color : 'black',
			message : 'Downloading 0 of 10',
			font : {
				fontSize : 14,
				fontWeight : 'bold'
			},
			top : 60
		});
		win.add(button);
		win.add(ind);

		// iOS specific progress bars
		if (isIos) {
			flexSpace = Titanium.UI.createButton({
				systemButton : Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
			});

			//
			// BAR STYLE INDICATOR
			//
			ind2 = Titanium.UI.createProgressBar({
				width : 200,
				min : 0,
				max : 10,
				value : 0,
				height : 70,
				color : 'black',
				message : 'Downloading 0 of 10',
				font : {
					fontSize : 14,
					fontWeight : 'bold'
				},
				style : Titanium.UI.iPhone.ProgressBarStyle.BAR,
				top : 120
			});

			//
			// PLACE INDICATOR IN NAV BAR
			//
			ind3 = Titanium.UI.createProgressBar({
				width : 100,
				min : 0,
				max : 10,
				value : 0,
				color : 'black',
				message : 'Downloading 0 of 10',
				font : {
					fontSize : 14,
					fontWeight : 'bold'
				},
				style : Titanium.UI.iPhone.ProgressBarStyle.PLAIN
			});

			//
			// PLACE INDICATOR IN TOOLBAR
			//
			ind4 = Titanium.UI.createProgressBar({
				width : 250,
				min : 0,
				max : 10,
				value : 0,
				color : 'black',
				message : 'Downloading 0 of 10',
				font : {
					fontSize : 14,
					fontWeight : 'bold'
				},
				style : Titanium.UI.iPhone.ProgressBarStyle.PLAIN
			});

			ind.style = Titanium.UI.iPhone.ProgressBarStyle.PLAIN;
			win.add(ind2);
			win.setTitleControl(ind3);
			win.setToolbar([flexSpace, ind4, flexSpace]);
		}

		//
		// BUTTON LISTENER TO KICK OFF PROGRESS BARS
		//
		button.addEventListener('click', function() {
			ind.show();

			if (isIos) {
				ind2.show();
				ind3.show();
				ind4.show();
			}

			val = 0;
			if (interval) {
				clearInterval(interval);
			}
			interval = setInterval(function() {
				Ti.API.info('INTERVAL FIRED value ' + val);
				if (val >= 11) {
					clearInterval(interval);
					ind.hide();
					if (isIos) {
						ind2.hide();
						ind3.hide();
						ind4.hide();
					}
					win.setTitle('Progress Bar');
					return;
				}
				ind.value = val;
				ind.message = 'Downloading ' + val + ' of 10';
				if (isIos) {
					ind2.value = val;
					ind2.message = 'Downloading ' + val + ' of 10';
					ind3.value = val;
					ind3.message = 'Downloading ' + val + ' of 10';
					ind4.value = val;
					ind4.message = 'Downloading ' + val + ' of 10';
				}
				val++;

			}, 1000);
		});
	}

	return win;
}

module.exports = progressbar;

