Ti._5.createClass('Titanium.UI.CoverFlowView', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'coverflowview', args, 'CoverFlowView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'images', null);

	Ti._5.member(this, 'selected', null);

	// Methods
	this.setImage = function(){
		console.debug('Method "Titanium.UI.CoverFlowView#.setImage" is not implemented yet.');
	};

	// Events
	this.addEventListener('change', function(){
		console.debug('Event "change" is not implemented yet.');
	});

	require.mix(this, args);
});