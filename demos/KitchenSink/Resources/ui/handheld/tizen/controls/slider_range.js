// Tizen-specific test for Ti.UI.Slider.minRange and Ti.UI.Slider.maxRange.

function slider_range() {
	var win = Ti.UI.createWindow({
			backgroundColor: 'white'
		}),
		customSlider = Titanium.UI.createSlider({
			min: 0,
			max: 100,
			minRange: 25,
			maxRange: 75,
			value: 25,
			width: 268,
			height: 40,
			top: 90,
			thumbImage: '/images/custom-slider-handle.png',
			leftTrackImage: '/images/custom-slider-left.9.png',
			rightTrackImage: '/images/custom-slider-right.9.png'
		}),
		resetButton = Ti.UI.createButton({
			left: 5, 
			top: 200, 
			right: 5, 
			height: 50,
			title: 'Range/25/75 (initial)'
		}),
		customButton = Ti.UI.createButton({
			left: 5, 
			top: 260, 
			right: 5, 
			height: 50,
			title: 'Range/min/max'
		});

	resetButton.addEventListener('click', function(e) {
		customSlider.min = 0;
		customSlider.max = 100;
		customSlider.minRange = 25;
		customSlider.maxRange = 75;
	});

	customButton.addEventListener('click', function(e) {
		customSlider.min = 0;
		customSlider.max = 100;
		customSlider.minRange = 0;
		customSlider.maxRange = 100;
	});

	win.add(customSlider);
	win.add(resetButton);
	win.add(customButton);

	customSlider.addEventListener('change', function(e) {
		Ti.API.debug('value: ' + e.value + ' left: ' + e.thumbOffset.x + ' top: ' + e.thumbOffset.y + ' width: ' +
			e.thumbSize.width + ' height: ' + e.thumbSize.height);
	});

	return win;
}

module.exports = slider_range;
