Ti._5.createClass('Titanium.UI.DashboardItem', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'dashboarditem', args, 'DashboardItem');

	// Properties
	Ti._5.member(this, 'badge');

	Ti._5.member(this, 'canDelete');

	Ti._5.member(this, 'image');

	Ti._5.member(this, 'selectedImage');


	// Events
	this.addEventListener('click', function(){
		console.debug('Event "click" is not implemented yet.');
	});
	this.addEventListener('delete', function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	this.addEventListener('move', function(){
		console.debug('Event "move" is not implemented yet.');
	});

	require.mix(this, args);
});