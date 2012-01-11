Ti._5.createClass('Ti.UI.DashboardView', function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, 'dashboardview', args, 'DashboardView');
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		data: null,
		wobble: null
	});

	// Methods
	obj.startEditing = function(){
		console.debug('Method "Titanium.UI.DashboardView#.startEditing" is not implemented yet.');
	};
	obj.stopEditing = function(){
		console.debug('Method "Titanium.UI.DashboardView#.stopEditing" is not implemented yet.');
	};

	// Events
	obj.addEventListener('commit', function(){
		console.debug('Event "commit" is not implemented yet.');
	});
	obj.addEventListener('delete', function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	obj.addEventListener('edit', function(){
		console.debug('Event "edit" is not implemented yet.');
	});
	obj.addEventListener('move', function(){
		console.debug('Event "move" is not implemented yet.');
	});

	require.mix(obj, args);
});