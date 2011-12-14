Ti._5.createClass("Ti.UI.EmailDialog", function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "emaildialog", args, "EmailDialog");

	// Properties
	Ti._5.prop(obj, {
		CANCELLED: 0,
		FAILED: 1,
		SAVED: 2,
		SENT: 3,
		barColor: null,
		bccRecipients: null,
		ccRecipients: null,
		html: null,
		messageBody: null,
		subject: null,
		toRecipients: null
	});

	// Methods
	obj.addAttachment = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.addAttachment" is not implemented yet.');
	};
	obj.isSupported = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.isSupported" is not implemented yet.');
	};
	obj.open = function(){
		console.debug('Method "Titanium.UI.EmailDialog#.open" is not implemented yet.');
	};

	// Events
	obj.addEventListener("complete", function(){
		console.debug('Event "complete" is not implemented yet.');
	});

	require.mix(obj, args);
});