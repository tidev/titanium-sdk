function tizen_power() {
	var win = Titanium.UI.createWindow(),
		buttonTurnOffScreen = Ti.UI.createButton({
			title: 'Turn Off Screen',
			top: 10
		}),
		Tizen = require('tizen'),
		brightnessLabel = Titanium.UI.createLabel({
			text: 'Brightness: ' + Tizen.Power.screenBrightness,
			top: 55,
			left: 20
		}),
		slider = Titanium.UI.createSlider({
			top: 80,
			left: 10,
			right: 10,
			min: 0,
			max: 1,
			value: Tizen.Power.screenBrightness
		});

	buttonTurnOffScreen.addEventListener('click', function(){
		Tizen.Power.turnScreenOff();
	});

	slider.addEventListener('change', function(e) {
		brightnessLabel.text = String.format('Brightness: %3.1f', e.value);
		Tizen.Power.screenBrightness = e.value;
	});

	win.add(buttonTurnOffScreen);
	win.add(slider);
	win.add(brightnessLabel);
	return win;
}

module.exports = tizen_power;