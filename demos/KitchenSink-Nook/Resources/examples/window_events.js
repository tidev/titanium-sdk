(function() {
	var win = Titanium.UI.currentWindow;
	var pad = function(x) {
		if (x < 10) {
			return '0' + x;
		}
		return x;
	}

	var formatTime = function() {
		var date = new Date();
		var h = date.getHours();
		var m = date.getMinutes();
		var s = date.getSeconds();
		return pad(h) + ':' + pad(m) + ':' + pad(s);
	}
	
	var addWindowPropertyEventListener = function(name, label) {
		if (Titanium.App.Properties.getString('window_' + name + '_event') != null) {
			label.text = name + ' fired at ' + Titanium.App.Properties.getString('window_' + name + '_event');
			label.color = '#555';
		}
		win.addEventListener(name, function(e) {
			var date = formatTime();
			Titanium.App.Properties.setString('window_' + name + '_event', date);
			label.text = name + ' fired at ' + date;
			label.color = '#555';
		});
	}
	
	var addXYWindowEventListener = function(name, label) {
		win.addEventListener(name, function(e) {
			label.color = 'red';
			label.text = name + ' fired -- x ' + Math.round(e.x) + ' y ' + Math.round(e.y);
			if (name === 'swipe') {
				label.text += ' direction ' + e.direction;
			}
			setTimeout(function() { label.color = '#555'; }, 200);
		});
	}
	
	var labels = [
		{ text:'focus', handler: addWindowPropertyEventListener },
		{ text:'blur', handler: addWindowPropertyEventListener },
		{ text:'open', handler: addWindowPropertyEventListener },
		{ text:'close', handler: addWindowPropertyEventListener },
		{ text:'touchstart', handler: addXYWindowEventListener },
		{ text:'touchmove', handler: addXYWindowEventListener },
		{ text:'touchend', handler: addXYWindowEventListener },
		{ text:'singletap', handler: addXYWindowEventListener },
		{ text:'doubletap', handler: addXYWindowEventListener },
		{ text:'twofingertap', handler: addXYWindowEventListener },
		{ text:'swipe', handler: addXYWindowEventListener },
		{ text:'click', handler: addXYWindowEventListener },
		{ text:'dblclick', handler: addXYWindowEventListener },
		{ text:'touchcancel', handler: addXYWindowEventListener },
		{ text:'longpress', handler: addXYWindowEventListener }
	];
	for (var i = 0; i < labels.length; i++) {
		var label = Ti.UI.createLabel({
			text: labels[i].text + ' -- not fired',
			left: 20,
			top: 10 + (i * 30),
			height: 'auto',
			width: 'auto',
			font: {
				fontSize: 24
			}
		});
		labels[i].handler(labels[i].text, label);
		win.add(label);
	}
})();