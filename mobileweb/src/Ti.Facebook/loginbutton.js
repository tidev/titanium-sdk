Ti._5.createClass("Ti.Facebook.LoginButton", function(args){
    var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "button", args, "LoginButton");
	Ti._5.Touchable(obj);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		click: null,
		style: null
	});

	// Events
	obj.addEventListener("globalPoint", function(){
		console.debug('Event "globalPoint" is not implemented yet.');
	});
	obj.addEventListener("dblclick", function(){
		console.debug('Event "dblclick" is not implemented yet.');
	});
});