Ti._5.createClass('Titanium.UI.Toolbar', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'toolbar', args, 'Toolbar');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	Ti._5.presetUserDefinedElements(this, args);
});