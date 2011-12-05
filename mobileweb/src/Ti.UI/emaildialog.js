Ti._5.createClass('Titanium.UI.EmailDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'emaildialog', args, 'EmailDialog');

	// Properties
	Ti._5.prop(this, 'CANCELLED');

	Ti._5.prop(this, 'FAILED');

	Ti._5.prop(this, 'SAVED');

	Ti._5.prop(this, 'SENT');

	Ti._5.prop(this, 'barColor');

	Ti._5.prop(this, 'bccRecipients');

	Ti._5.prop(this, 'ccRecipients');

	Ti._5.prop(this, 'html');

	Ti._5.prop(this, 'messageBody');

	Ti._5.prop(this, 'subject');

	Ti._5.prop(this, 'toRecipients');

	// Methods
	this.addAttachment = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.addAttachment" is not implemented yet.');
	};
	this.isSupported = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.isSupported" is not implemented yet.');
	};
	this.open = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.open" is not implemented yet.');
	};

	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});

	require.mix(this, args);
});