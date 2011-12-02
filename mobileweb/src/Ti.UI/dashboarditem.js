Ti._5.createClass('Titanium.UI.DashboardItem', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'dashboarditem', args, 'DashboardItem');

	// Properties
	Ti._5.member(this, 'badge', null);

	Ti._5.member(this, 'canDelete', null);

	Ti._5.member(this, 'image', null);

	Ti._5.member(this, 'selectedImage', null);


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