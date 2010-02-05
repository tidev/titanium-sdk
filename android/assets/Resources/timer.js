
function alert(msg) {
	var alertDialog = Ti.UI.createAlertDialog({ title: 'word', buttons: ['OK', 'Cancel']});
	alertDialog.setMessage(msg);
	alertDialog.show();
}

var win = Ti.UI.createWindow({
	backgroundColor : '#ccc'
});

var setTimeoutButton = Ti.UI.createButton({
	title: "setTimeout",
	width: '100px', height: '40px', left: '10px', top: '10px'
});
var clearTimeoutButton = Ti.UI.createButton({
	title: "clearTimeout",
	width: '120px', height: '40px', left: '10px', top: '50px'
});

var intervalLabel = Ti.UI.createLabel({
	text: "count: 0",
	width: "100px", height: '40px', left: '150px', top: '90px',
	color: 'black'
});

var setIntervalButton = Ti.UI.createButton({
	title: "setInterval",
	width: '100px', height: '40px', left: '10px', top: '90px'
});
var clearIntervalButton = Ti.UI.createButton({
	title: "clearInterval",
	width: '120px', height: '40px', left: '10px', top: '130px'
});

var timeoutTimer;
setTimeoutButton.addEventListener("click", function(event){
	var start = new Date().getTime();
	timeoutTimer = Ti.setTimeout(function(){
		var time = new Date().getTime() - start;
		alert("reached timeout: " + time);
	}, 1500);
});

clearTimeoutButton.addEventListener("click", function(event){
	Ti.clearTimeout(timeoutTimer);
});

var count = 0;
var intervalTimer;
setIntervalButton.addEventListener("click", function(event){
	intervalTimer = Ti.setInterval(function(){
		intervalLabel.text = "count: "+(++count);
	}, 500);
});

clearIntervalButton.addEventListener("click", function(event){
	Ti.clearInterval(intervalTimer);
});

win.add(setTimeoutButton);
win.add(clearTimeoutButton);
win.add(setIntervalButton);
win.add(clearIntervalButton);
win.add(intervalLabel);
win.open();