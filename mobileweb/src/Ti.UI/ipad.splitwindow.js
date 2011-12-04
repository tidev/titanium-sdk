Ti._5.createClass('Titanium.UI.iPad.SplitWindow', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad.splitwindow', args, 'iPad.SplitWindow');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'detailView');

	Ti._5.member(this, 'masterView');


	// Events
	this.addEventListener('visible', function(){
		console.debug('Event "visible" is not implemented yet.');
	});

	require.mix(this, args);
});