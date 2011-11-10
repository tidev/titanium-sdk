//Desired operating mode for any soft input area. May any combination of:
//	One of the visibility states SOFT_INPUT_STATE_UNSPECIFIED, SOFT_INPUT_STATE_UNCHANGED, 
//      SOFT_INPUT_STATE_HIDDEN, SOFT_INPUT_STATE_ALWAYS_VISIBLE, or SOFT_INPUT_STATE_VISIBLE.
//	One of the adjustment options SOFT_INPUT_ADJUST_UNSPECIFIED, SOFT_INPUT_ADJUST_RESIZE, or SOFT_INPUT_ADJUST_PAN.

var win = Ti.UI.currentWindow;
win.backgroundColor = 'gray';

var label = Ti.UI.createLabel({
	text : "windowSoftInputMode requires a heavyweight window, specifying it will force the creation of one.",
	left : 5, top : 5, right : 5,
	color : 'black',
	font : { fontWeight : 'bold' }
});
win.add(label);


var softState = null;
var softAdjust = null;

// ----------------------------------------------------

var b1 = Ti.UI.createButton({ width : '50', height : '50', left : 10, top : 100});
b1.addEventListener('click', function() {
	updateSoftAdjust(Ti.UI.Android.SOFT_INPUT_ADJUST_PAN);
});
win.add(b1);

var l1 = Ti.UI.createLabel({ 
	text : 'SOFT_INPUT_ADJUST_PAN', color : 'black',
	left : 80, height : 30, right : 10, top : 110
});
win.add(l1);

var b2 = Ti.UI.createButton({ width : '50', height : '50', left : 10, top : 160});
b2.addEventListener('click', function() {
	updateSoftAdjust(Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE);
});
win.add(b2);

var l2 = Ti.UI.createLabel({ 
	text : 'SOFT_INPUT_ADJUST_RESIZE', color : 'black',
	left : 80, height : 30, right : 10, top : 170
});
win.add(l2);

var b3 = Ti.UI.createButton({ width : '50', height : '50', left : 10, top : 220});
b3.addEventListener('click', function() {
	updateSoftAdjust(Ti.UI.Android.SOFT_INPUT_ADJUST_UNSPECIFIED);
});
win.add(b3);

var l3 = Ti.UI.createLabel({ 
	text : 'SOFT_INPUT_ADJUST_UNSPECIFIED', color : 'black',
	left : 80, height : 30, right : 10, top : 230
});
win.add(l3);

function updateSoftAdjust(s) {
	l1.font = {};
	l2.font = {};
	l3.font = {};
	switch(s) {
		case Ti.UI.Android.SOFT_INPUT_ADJUST_PAN :
			l1.font = {fontWeight:'bold'};
			break;
		case Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE :
			l2.font = {fontWeight:'bold'};
			break;
		case Ti.UI.Android.SOFT_INPUT_ADJUST_UNSPECIFIED :
			l3.font = {fontWeight:'bold'};
			break;
	}
	softAdjust = s;
}

//-------------------------------------------------------

var launch = Ti.UI.createButton({
	left : 10, height : 60, bottom : 10, right : 10,
	title : 'Launch'
});
launch.addEventListener('click', function() {
	var opts = {
		navBarHidden : false,
		backgroundColor : 'white'
	};
	
	var state = null;
	
	
	if (softState != null) {
		state = softState;
	}
		
	if (softAdjust != null) {
		if (state === null) {
			state = softAdjust;
		} else {
			state += softAdjust;
		}
	}

	if (state != null) {
		opts.windowSoftInputMode = state;
	}
	
	var w = Ti.UI.createWindow(opts);
	
	var l = Ti.UI.createLabel({
		text : 'Watch what happens to me.', top : 0, left : 20, right : 20,
		color: 'black'
	});
	w.add(l);
	
	var sv = Ti.UI.createScrollView({ top : 20, width:280, contentWidth:"300", contentHeight:"450"});
	w.add(sv);
	var v = Ti.UI.createView({
		backgroundImage : '/images/cloud.png', width:280, height:450
	});
	sv.add(v);

	for(var i = 0; i < 3; i++) {
		var e = Ti.UI.createTextField({ top : (250 + (50 *i)), height : 50, width : 200});
		v.add(e);
	}
		
	w.open();
});
win.add(launch);