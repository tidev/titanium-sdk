
var win = Ti.UI.currentWindow;
if (!win) {
	win = Ti.UI.createWindow({
	});
}

win.backgroundColor ='#081d35';

var btn = Ti.UI.createButton({
	title : 'Click Me',
	left : '10px',
	right : '10px',
	top : '10px',
});
btn.height = "50px";
var incr = 0;

var updateBtnHeight = function() {
	btn.height = (50 + (incr * 10)) + "px";
	btn.setTitle("New Height: " + btn.getHeight());
}
var btnId = btn.addEventListener('click', function(e) {
		Ti.API.warn("I've been clicked!!!");
		if (sw.value) {
			incr += 1;
			updateBtnHeight();
		}
	});
btn.setBackgroundColor("rgba(128,128,128,128)");

var sw = Ti.UI.createSwitch({
	value : true,
	left : "10px",
	width: "60px",
	top: "70px",
	height: "40px"
});
sw.addEventListener('change', function(e) {
	if (!e.value) {
		btn.height = "50px";
		incr = 0;
	}
});

var slider = Ti.UI.createSlider({
	min : 0, max : 10, value : 0,
	left : "10px", right : "10px", bottom : "10px",
	height : "35px"
});
slider.addEventListener('change', function(e)
{
	Ti.API.warn("slider value: " + e.value);
	alertDialog.setMessage("Slider Value: " + e.value);
	incr = e.value;
	updateBtnHeight();
});

var slider2 = Ti.UI.createSlider({
	min : 0, max : 255, value : 255,
	left : "10px", right : "10px", bottom : "55px",
	height : "35px"
});
slider2.addEventListener('change', function(e)
{
	win.setBackgroundColor("rgba(255,0,0," + e.value + ")");
});

var notify = Ti.UI.createNotification({ message:"Yay!"});

var btnNotify = Ti.UI.createButton({
	title : 'Toast',
	left : '10px',
	right : '10px',
	top : '200px',
	height : '50px'
});
btnNotify.addEventListener('click', function(e) {
	notify.show();
});

var tf = Titanium.UI.createTextArea({
	hintText : 'A text field',
	left : '10px',
	right : '10px',
	top : '260px',
	height : '70px',
	textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
	fontSize : '10px'
});
tf.addEventListener('blur', function(e) {
	Ti.API.info("BLUR");
	tf.blur();
});

win.add(btn);
win.add(sw);
win.add(slider);
win.add(slider2);
win.add(btnNotify);
win.add(tf);

//win.open();

tf.backgroundColor= "blue";
tf.color = "white";

var copyBtn = Ti.UI.createButton({
	title : "Copy Text",
	left : "80px",
	width: "100px",
	top: "70px",
	height: "40px"
});
copyBtn.addEventListener('click', function(e){
	tf.value = tf.value + "\n" + btn.title;
});
win.add(copyBtn);

//setTimeout(function(){
//	if (btn.title == 'Click Me') {
//		btn.title = "Hurry Up and Click Me!";
//	}
//}, 5000);

btn.title = "Hurry and Click";

var alertDialog = Ti.UI.createAlertDialog({ title: 'Alerty!', buttons: ['OK', "Bail"]});
alertDialog.setMessage("Hello Titanium!");
alertDialog.setOptions(["Option 1", "Option 2", "Option 3"]);
alertDialog.setMessage(null);
alertDialog.addEventListener('click', function(e) {
	notify.setMessage("You clicked: " + e.index);
	notify.show();
});

var alertBtn = Ti.UI.createButton({
	title : "Alert!",
	left : "190px",
	width: "80px",
	top: "70px",
	height: "40px"
});
win.add(alertBtn);

alertBtn.addEventListener('click', function(e) {
	alertDialog.show();
});

var progressBtn = Ti.UI.createButton({
	title : "Progress",
	left : "10px",
	width: "80px",
	top: "120px",
	height: "40px"
});
win.add(progressBtn);

progressBtn.addEventListener('click', function(e) {
	var ai = Titanium.UI.createActivityIndicator({
		message : 'Testing...',
		min : 0,
		max : 100,
		type : Ti.UI.ActivityIndicator.DETERMINANT,
		location : Ti.UI.ActivityIndicator.DIALOG
	});
	ai.show();
	for(i = 0; i < 101; i++) {
		Ti.API.debug("Progress: " + i);
		ai.value = i;
	}
	ai.hide();
});