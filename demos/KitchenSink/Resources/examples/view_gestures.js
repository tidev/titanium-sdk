var win = Titanium.UI.currentWindow;
win.backgroundColor = 'blue';
win.name = "window";

var view = Ti.UI.createView({
  backgroundColor:"red"
});

win.add(view);

function pinchHandler(e) {
  Ti.API.info('pinch:' + JSON.stringify(e));
}

function longpressHandler(e) {
  Ti.API.info('longpress:' + JSON.stringify(e));
}

view.addEventListener('pinch', pinchHandler);
view.addEventListener('longpress', longpressHandler);

var b1 = Titanium.UI.createButton({
	title:'Remove Pinch',
	height:40,
	width:200,
	top:70
});
win.add(b1);

function buttonHandler(e) {
	view.removeEventListener('pinch', pinchHandler);
}

b1.addEventListener('click', buttonHandler);
