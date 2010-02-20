var win= Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Check the log for output',
	width:'auto',
	height:'auto'
});

win.add(l);

// define an object
var obj = {name:'foo', value:'bar'};

Titanium.API.log('ERROR','ERROR MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.debug('DEBUG MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.error('ERROR MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.warn('WARN MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.info('INFO MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.trace('TRACE MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.notice('NOTICE MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
Titanium.API.critical('CRITICAL MESSAGE FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
alert('ALERT LOG FROM FUNCTION - name: ' + obj.name + ' value: ' + obj.value);
