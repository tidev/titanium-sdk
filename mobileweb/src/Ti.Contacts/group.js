(function(api){
	// Properties
	var _name = null;
	Object.defineProperty(api, 'name', {
		get: function(){return _name;},
		set: function(val){return _name = val;}
	});

	// Methods
	api.add = function(){
		console.debug('Method "Titanium.Contacts.Group..add" is not implemented yet.');
	};
	api.members = function(){
		console.debug('Method "Titanium.Contacts.Group..members" is not implemented yet.');
	};
	api.remove = function(){
		console.debug('Method "Titanium.Contacts.Group..remove" is not implemented yet.');
	};
	api.sortedMembers = function(){
		console.debug('Method "Titanium.Contacts.Group..sortedMembers" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Contacts.Group'));