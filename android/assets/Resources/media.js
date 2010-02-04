var snd = Ti.Media.createSound("media/cricket.wav");

var win = Ti.UI.createWindow({
	backgroundColor : '#081d35'
});

var play = Ti.UI.createButton({
	title : 'Play',
	left : '10px',
	top : '10px',
	right : '10px',
	height : '40px'
});

play.addEventListener("click", function(e) {
	snd.play();
});

var stop = Ti.UI.createButton({
	title : 'Stop',
	left : '10px',
	top : '50px',
	right : '10px',
	height : '40px'
});

stop.addEventListener("click", function(e) {
	snd.stop();
});

win.add(play);
win.add(stop);

win.open();