Ti._5.createClass("Titanium.UI.DashboardItem", function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, "dashboarditem", args, "DashboardItem");

	// Properties
	Ti._5.prop(obj, {
		"badge": null,
		"canDelete": null,
		"image": null,
		"selectedImage": null
	});

	// Events
	obj.addEventListener("click", function(){
		console.debug('Event "click" is not implemented yet.');
	});
	obj.addEventListener("delete", function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	obj.addEventListener("move", function(){
		console.debug('Event "move" is not implemented yet.');
	});

	require.mix(obj, args);
});