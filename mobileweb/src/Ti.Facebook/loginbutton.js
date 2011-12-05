Ti._5.createClass('Titanium.Facebook.LoginButton', function(args){
    var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'button', args, 'LoginButton');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'style');

	Ti._5.prop(this, 'click');


	// Events
	this.addEventListener('globalPoint', function(){
		console.debug('Event "globalPoint" is not implemented yet.');
	});
	this.addEventListener('dblclick', function(){
		console.debug('Event "dblclick" is not implemented yet.');
	});
});