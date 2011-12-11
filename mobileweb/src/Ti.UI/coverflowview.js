Ti._5.createClass("Titanium.UI.CoverFlowView", function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "coverflowview", args, "CoverFlowView");
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		"images": null,
		"selected": false
	});

	// Methods
	obj.setImage = function(){
		console.debug('Method "Titanium.UI.CoverFlowView#.setImage" is not implemented yet.');
	};

	// Events
	obj.addEventListener("change", function(){
		console.debug('Event "change" is not implemented yet.');
	});

	require.mix(obj, args);
});