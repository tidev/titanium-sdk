Ti._5.createClass('Titanium.UI.iPhone.NavigationGroup', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.navigationgroup', args, 'iPhone.NavigationGroup');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	// Methods
	this.close = function(){
		console.debug('Method "Titanium.UI.iPhone.NavigationGroup#.close" is not implemented yet.');
	};
	this.open = function(){
		console.debug('Method "Titanium.UI.iPhone.NavigationGroup#.open" is not implemented yet.');
	};

	Ti._5.presetUserDefinedElements(this, args);
});