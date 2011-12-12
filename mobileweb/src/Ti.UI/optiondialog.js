Ti._5.createClass("Ti.UI.OptionDialog", function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "optiondialog", args, "OptionDialog");

	// Properties
	Ti._5.prop(obj, {
		androidView: null,
		cancel: null,
		destructive: null,
		options: null,
		selectedIndex: null,
		title: null,
		titleid: null
	});

	// Methods
	obj.show = function(){
		console.debug('Method "Titanium.UI.OptionDialog#.show" is not implemented yet.');
	};

	// Events
	obj.addEventListener("click", function(){
		console.debug('Event "click" is not implemented yet.');
	});

	require.mix(obj, args);
});