var win = Ti.UI.currentWindow;
win.backgroundColor = "white";

var customSlider = Titanium.UI.createSlider({
	min:0,
	max:100,
	minRange:25,
	maxRange:75,
	value:25,
	width:268,
	height:40,
	top:90,
	thumbImage: '/images/custom-slider-handle.png',
	leftTrackImage: '/images/custom-slider-left.9.png',
	rightTrackImage: '/images/custom-slider-right.9.png'
});

var resetButton = Ti.UI.createButton({
	left: 5, top : 200, right: 5, height: 50,
	title: 'Range/25/75 (initial)'
});
resetButton.addEventListener('click', function(e) {
	customSlider.min = 0;
	customSlider.max = 100;
	customSlider.minRange = 25;
	customSlider.maxRange = 75;
});

var customButton = Ti.UI.createButton({
	left: 5, top : 260, right: 5, height: 50,
	title: 'Range/min/max'
});
customButton.addEventListener('click', function(e) {
	customSlider.min = -5;
	customSlider.max = 5;
});

win.add(customSlider);
win.add(resetButton);
win.add(customButton);

customSlider.addEventListener('change', function(e) {
	Ti.API.debug("value: " + e.value + " left: " + e.thumbOffset.x + " top: " + e.thumbOffset.y + " width: " +
		e.thumbSize.width + "height: " + e.thumbSize.height);
});

//win.open({ animated : false });