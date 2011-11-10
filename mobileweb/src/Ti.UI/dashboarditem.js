Ti._5.createClass('Titanium.UI.DashboardItem', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'dashboarditem', args, 'DashboardItem');

	// Properties
	var _badge = null;
	Object.defineProperty(this, 'badge', {
		get: function(){return _badge;},
		set: function(val){return _badge = val;}
	});

	var _canDelete = null;
	Object.defineProperty(this, 'canDelete', {
		get: function(){return _canDelete;},
		set: function(val){return _canDelete = val;}
	});

	var _image = null;
	Object.defineProperty(this, 'image', {
		get: function(){return _image;},
		set: function(val){return _image = val;}
	});

	var _selectedImage = null;
	Object.defineProperty(this, 'selectedImage', {
		get: function(){return _selectedImage;},
		set: function(val){return _selectedImage = val;}
	});


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

	Ti._5.presetUserDefinedElements(this, args);
});