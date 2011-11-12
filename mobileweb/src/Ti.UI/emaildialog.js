Ti._5.createClass('Titanium.UI.EmailDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'emaildialog', args, 'EmailDialog');

	// Properties
	var _CANCELLED = null;
	Object.defineProperty(this, 'CANCELLED', {
		get: function(){return _CANCELLED;},
		set: function(val){return _CANCELLED = val;}
	});

	var _FAILED = null;
	Object.defineProperty(this, 'FAILED', {
		get: function(){return _FAILED;},
		set: function(val){return _FAILED = val;}
	});

	var _SAVED = null;
	Object.defineProperty(this, 'SAVED', {
		get: function(){return _SAVED;},
		set: function(val){return _SAVED = val;}
	});

	var _SENT = null;
	Object.defineProperty(this, 'SENT', {
		get: function(){return _SENT;},
		set: function(val){return _SENT = val;}
	});

	var _barColor = null;
	Object.defineProperty(this, 'barColor', {
		get: function(){return _barColor;},
		set: function(val){return _barColor = val;}
	});

	var _bccRecipients = null;
	Object.defineProperty(this, 'bccRecipients', {
		get: function(){return _bccRecipients;},
		set: function(val){return _bccRecipients = val;}
	});

	var _ccRecipients = null;
	Object.defineProperty(this, 'ccRecipients', {
		get: function(){return _ccRecipients;},
		set: function(val){return _ccRecipients = val;}
	});

	var _html = null;
	Object.defineProperty(this, 'html', {
		get: function(){return _html;},
		set: function(val){return _html = val;}
	});

	var _messageBody = null;
	Object.defineProperty(this, 'messageBody', {
		get: function(){return _messageBody;},
		set: function(val){return _messageBody = val;}
	});

	var _subject = null;
	Object.defineProperty(this, 'subject', {
		get: function(){return _subject;},
		set: function(val){return _subject = val;}
	});

	var _toRecipients = null;
	Object.defineProperty(this, 'toRecipients', {
		get: function(){return _toRecipients;},
		set: function(val){return _toRecipients = val;}
	});

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

	Ti._5.presetUserDefinedElements(this, args);
});