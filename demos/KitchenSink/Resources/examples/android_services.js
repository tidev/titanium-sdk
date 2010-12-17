/*global Ti, alert */
var SECS = 5;
var URL = 'testservice.js';

var win = Ti.UI.currentWindow;
var title = Ti.UI.createLabel({
	top: 0, left: 5, right: 5, height: 40,
	text: 'A service that runs its code every ' + SECS + ' secs.  See Resources/android/testservice.js.  Console:'
});
win.add(title);

var console = Ti.UI.createLabel({
	top: 45, left: 5, right: 5, height: 200,
	backgroundColor: 'white', color: 'black',
	font: {fontSize: 12}, verticalAlign: 'top'
});
win.add(console);

function addMsg(msg) {
	Ti.API.info('SERVICE TEST: ' + msg);
	var text = console.text;
	if (text && text.length > 0) {
		text = msg + '\n' + text;
	} else {
		text = msg;
	}
	console.text = text;
}

Ti.App.addEventListener('test_service_fire', function(data) {
	addMsg('Service says: "' + data.message + '"');
});

var checkButton = Ti.UI.createButton({
	title: 'Check if Test Service is running',
	left: 5, right: 5, top: 250, height: 35
});
checkButton.addEventListener('click', function(){
	if (Ti.Android.isServiceRunning(Ti.Android.createServiceIntent({url: URL}))) {
		addMsg('Service IS running');
	} else {
		addMsg('Service is NOT running');
	}
});
win.add(checkButton);

var startedButton = Ti.UI.createButton({
	title: 'Start Service via startService()',
	left: 5, right: 5, top: 290, height: 35
});

startedButton.addEventListener('click', function() {
	addMsg('Starting via startService');
	var intent = Ti.Android.createServiceIntent({
		url: URL
	});
	intent.putExtra('interval', SECS * 1000);
	intent.putExtra('message', 'Hi from started service');
	Ti.Android.startService(intent);
});
win.add(startedButton);

var bindButton = Ti.UI.createButton({
	top: 330, left: 5, right: 5, height: 35,
	title: 'Start Service via createService()/start()'
});

bindButton.addEventListener('click', function() {
	addMsg('Starting via createService() / start()');
	var intent = Ti.Android.createServiceIntent({
		url: URL
	});
	intent.putExtra('interval', SECS * 1000);
	intent.putExtra('message', 'Hi from bound service');
	var service = Ti.Android.createService(intent);
	service.addEventListener('start', function(e) {
		addMsg('Starting... Instance #' + e.source.serviceInstanceId + ' (bound)');
	});
	service.addEventListener('pause',function(e) {
		addMsg('Bound instance #' + e.source.serviceInstanceId + ' paused (iteration #' + e.iteration + ')');
		if (e.iteration == 3) {
			addMsg('Bound instance #' + e.source.serviceInstanceId + ' has had 3 iterations... going to stop it now.');
			e.source.stop();
		}
	});
	service.addEventListener('resume',function(e) {
		addMsg('Bound instance #' + e.source.serviceInstanceId + ' resumed (iteration #' + e.iteration + ')');
	});
	service.start();
});
win.add(bindButton);

var stopButton = Ti.UI.createButton({
	top: 370, left: 5, right: 5, height: 35,
	title: 'Stop Service via stopService()'
});
stopButton.addEventListener('click', function() {
	var intent = Ti.Android.createServiceIntent({url: URL});
	Ti.Android.stopService(intent);
	addMsg('stopService() called. NOTE: service only stops if no "bound" proxies are still alive. "Bound" proxies are those created with createService()');
});
win.add(stopButton);
