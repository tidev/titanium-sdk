var win = Ti.UI.currentWindow;

var minLabel = Ti.UI.createLabel({
	bottom: 10, width:100, left: 10,
	text : 'Min: 0'
});
win.add(minLabel);

var maxLabel = Ti.UI.createLabel({
	bottom: 10, width:100, right: 10,
	text : 'Max: 100'
});
win.add(maxLabel);

var posLabel = Ti.UI.createLabel({
	bottom: 10, width:100, left: 120,
	text : 'Pos: 0'
});
win.add(posLabel);

var slider = Ti.UI.createSlider({
    value: 0,
    min: 0,
    max: 100
});
slider.addEventListener('change', function(e) {
	minLabel.text = "Min: " + slider.min;
	posLabel.text = "Pos: " + slider.value;
	maxLabel.text = "Max: " + slider.max;
});
win.add(slider);

var btn1 = Ti.UI.createButton({
	'title' : '0/0/100',
	left : 10, top: 10, height:30, width:80
});
btn1.addEventListener('click', function() {
	slider.min = 0;
	slider.max = 100;
	slider.value = 0;
});
win.add(btn1);

var btn2 = Ti.UI.createButton({
	'title' : '0/5/10',
	left : 10, top: 40, height:30, width:80
});
btn2.addEventListener('click', function() {
	slider.min = 0;
	slider.max = 10;
	slider.value = 5;
});
win.add(btn2);

var btn3 = Ti.UI.createButton({
	'title' : '-5/75/105',
	left : 10, top: 70, height:30, width:80
});
btn3.addEventListener('click', function() {
	slider.min = -5;
	slider.max = 105;
	slider.value = 75;
});
win.add(btn3);
