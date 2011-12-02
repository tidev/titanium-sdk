Ti._5.createClass('Titanium.UI.EmailDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'emaildialog', args, 'EmailDialog');

	// Properties
	Ti._5.member(this, 'CANCELLED', null);

	Ti._5.member(this, 'FAILED', null);

	Ti._5.member(this, 'SAVED', null);

	Ti._5.member(this, 'SENT', null);

	Ti._5.member(this, 'barColor', null);

	Ti._5.member(this, 'bccRecipients', null);

	Ti._5.member(this, 'ccRecipients', null);

	Ti._5.member(this, 'html', null);

	Ti._5.member(this, 'messageBody', null);

	Ti._5.member(this, 'subject', null);

	Ti._5.member(this, 'toRecipients', null);

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