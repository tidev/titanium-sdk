define("Ti/Facebook/LoginButton", ["Ti/_/Evented"], function(Evented) {
	
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
		/* This should fire the event, not listen for it
		obj.addEventListener("dblclick", function(){
			console.debug('Event "dblclick" is not implemented yet.');
		});*/
	});

});