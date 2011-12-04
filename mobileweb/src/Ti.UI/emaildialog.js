Ti._5.createClass('Titanium.UI.EmailDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'emaildialog', args, 'EmailDialog');

	// Properties
	Ti._5.member(this, 'CANCELLED');

	Ti._5.member(this, 'FAILED');

	Ti._5.member(this, 'SAVED');

	Ti._5.member(this, 'SENT');

	Ti._5.member(this, 'barColor');

	Ti._5.member(this, 'bccRecipients');

	Ti._5.member(this, 'ccRecipients');

	Ti._5.member(this, 'html');

	Ti._5.member(this, 'messageBody');

	Ti._5.member(this, 'subject');

	Ti._5.member(this, 'toRecipients');

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