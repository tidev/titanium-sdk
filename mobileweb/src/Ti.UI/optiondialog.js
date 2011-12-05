Ti._5.createClass('Titanium.UI.OptionDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'optiondialog', args, 'OptionDialog');

	// Properties
	Ti._5.prop(this, 'androidView');

	Ti._5.prop(this, 'cancel');

	Ti._5.prop(this, 'destructive');

	Ti._5.prop(this, 'options');

	Ti._5.prop(this, 'selectedIndex');

	Ti._5.prop(this, 'title');

	Ti._5.prop(this, 'titleid');

	// Methods
	this.show = function(){
		console.debug('Method "Titanium.UI.OptionDialog#.show" is not implemented yet.');
	};

	// Events
	this.addEventListener('click', function(){
		console.debug('Event "click" is not implemented yet.');
	});

	require.mix(this, args);
});