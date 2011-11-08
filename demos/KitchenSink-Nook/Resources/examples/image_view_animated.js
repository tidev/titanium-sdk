var win = Titanium.UI.currentWindow;

// show indicator from app.js
Titanium.App.fireEvent('show_indicator');

// load images
var images = [];
for (var i=1;i<18;i++)
{
	images.push('../images/campFire' + ((i<10)?'0'+i:i)+'.gif');
}

//
// CREATE IMAGE VIEW
//

var imageView = Titanium.UI.createImageView({
	images:images,
	duration:100, // in milliseconds, the time before next frame is shown
	repeatCount:0,  // 0 means animation repeats indefinitely, use > 1 to control repeat count
	top:0
});


var frame = Ti.UI.createLabel({
	text:'',
	color:'white',
	width:'auto',
	height:'auto',
	font:{fontSize:48,fontFamily:'Helvetica Neue'}
});


//
// IMAGE VIEW EVENTS
//

// listen for load event (when all images are loaded)
imageView.addEventListener('load', function(e)
{
	// hide indicator from app.js
	Titanium.App.fireEvent('hide_indicator');

	// start animation
	imageView.start();
});

// listen for start event (when animation is started)
imageView.addEventListener('start', function()
{
	Titanium.API.info('ImageView animation started');
});

// listen for stop event (when animation is stopped)
imageView.addEventListener('stop', function()
{
	Titanium.API.info('ImageView animation stopped');
});

// listen for change event (when animation is changed)
imageView.addEventListener('change', function(e)
{
	Titanium.API.info('ImageView animation frame has changed, index ' + e.index);
	frame.text = e.index;
});

win.add(imageView);

//
// CONTROLS
//

// start animation
var start = Titanium.UI.createButton({
	title:'Start Animation',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:10,
	left:10
});
start.addEventListener('click', function()
{
	if (imageView.animating === false)
	{
		imageView.start();
	}
});
win.add(start);

// reverse animation
var reverse = Titanium.UI.createButton({
	title:'Reverse',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:90,
	left:10
});
reverse.addEventListener('click', function()
{
	imageView.reverse = !imageView.reverse;
});
win.add(reverse);

// stop animation
var stop = Titanium.UI.createButton({
	title:'Stop Animation',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:10,
	right:10
});
stop.addEventListener('click', function()
{
	if (imageView.animating)
	{
		imageView.stop();
	}
});
win.add(stop);

// pause animation
var pause = Titanium.UI.createButton({
	title:'Pause Animation',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:90,
	right:10
});
pause.addEventListener('click', function()
{
	if (imageView.animating)
	{
		imageView.pause();
	}
});
win.add(pause);

// increase duration
var durationUp = Titanium.UI.createButton({
	title:'Duration++',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:50,
	left:10
});

// help text
var l = Titanium.UI.createLabel({
	text:'Duration = 110 ms (re-start to apply)',
	bottom:10,
	color:'white',
	width:'auto',
	height:'auto',
	font: {
		fontSize:24	
	}
});

durationUp.addEventListener('click', function()
{
	imageView.duration += 100;
	l.text = 'Duration = ' + imageView.duration + ' ms (re-start to apply)';

});
win.add(durationUp);

// decrease duration
var durationDown = Titanium.UI.createButton({
	title:'Duration--',
	height:30,
	width:120,
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	top:50,
	right:10
});


durationDown.addEventListener('click', function()
{
	if (imageView.duration > 100)
	{
		imageView.duration -= 100;
	}
	else if (imageView.duration != 0)
	{
		imageView.duration -= 10;
	}
	l.text = 'Duration = ' + imageView.duration + ' ms (re-start to apply)';

});
win.add(durationDown);

win.add(l);

win.add(frame);
