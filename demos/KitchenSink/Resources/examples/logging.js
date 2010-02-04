var win= Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Check the log for output'
});

win.add(l);

Titanium.API.log('ERROR','ERROR MESSAGE FROM FUNCTION');
Titanium.API.debug('DEBUG MESSAGE FROM FUNCTION');
Titanium.API.error('ERROR MESSAGE FROM FUNCTION');
Titanium.API.warn('WARN MESSAGE FROM FUNCTION');
Titanium.API.info('INFO MESSAGE FROM FUNCTION');
Titanium.API.trace('TRACE MESSAGE FROM FUNCTION');
Titanium.API.notice('NOTICE MESSAGE FROM FUNCTION');
Titanium.API.critical('CRITICAL MESSAGE FROM FUNCTION');
alert('ALERT LOG FROM FUNCTION');
