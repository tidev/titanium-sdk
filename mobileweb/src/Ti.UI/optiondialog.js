Ti._5.createClass('Titanium.UI.OptionDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'optiondialog', args, 'OptionDialog');

	// Properties
	Ti._5.member(this, 'androidView');

	Ti._5.member(this, 'cancel');

	Ti._5.member(this, 'destructive');

	Ti._5.member(this, 'options');

	Ti._5.member(this, 'selectedIndex');

	Ti._5.member(this, 'title');

	Ti._5.member(this, 'titleid');

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