(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, {
		animate: null,
		image: null,
		leftButton: null,
		leftView: null,
		pincolor: null,
		rightButton: null,
		rightView: null,
		subtitle: null,
		subtitleid: null,
		title: null,
		titleid: null
	});

})(Ti._5.createClass(Ti.Map.Annotation));