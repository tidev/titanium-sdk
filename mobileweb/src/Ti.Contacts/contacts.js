(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _CONTACTS_KIND_ORGANIZATION = null;
	Object.defineProperty(api, 'CONTACTS_KIND_ORGANIZATION', {
		get: function(){return _CONTACTS_KIND_ORGANIZATION;},
		set: function(val){return _CONTACTS_KIND_ORGANIZATION = val;}
	});

	var _CONTACTS_KIND_PERSON = null;
	Object.defineProperty(api, 'CONTACTS_KIND_PERSON', {
		get: function(){return _CONTACTS_KIND_PERSON;},
		set: function(val){return _CONTACTS_KIND_PERSON = val;}
	});

	var _CONTACTS_SORT_FIRST_NAME = null;
	Object.defineProperty(api, 'CONTACTS_SORT_FIRST_NAME', {
		get: function(){return _CONTACTS_SORT_FIRST_NAME;},
		set: function(val){return _CONTACTS_SORT_FIRST_NAME = val;}
	});

	var _CONTACTS_SORT_LAST_NAME = null;
	Object.defineProperty(api, 'CONTACTS_SORT_LAST_NAME', {
		get: function(){return _CONTACTS_SORT_LAST_NAME;},
		set: function(val){return _CONTACTS_SORT_LAST_NAME = val;}
	});

	// Methods
	api.createGroup = function(){
		console.debug('Method "Titanium.Contacts..createGroup" is not implemented yet.');
	};
	api.createPerson = function(){
		console.debug('Method "Titanium.Contacts..createPerson" is not implemented yet.');
	};
	api.getAllGroups = function(){
		console.debug('Method "Titanium.Contacts..getAllGroups" is not implemented yet.');
	};
	api.getAllPeople = function(){
		console.debug('Method "Titanium.Contacts..getAllPeople" is not implemented yet.');
	};
	api.getGroupByID = function(){
		console.debug('Method "Titanium.Contacts..getGroupByID" is not implemented yet.');
	};
	api.getPeopleWithName = function(){
		console.debug('Method "Titanium.Contacts..getPeopleWithName" is not implemented yet.');
	};
	api.getPersonByID = function(){
		console.debug('Method "Titanium.Contacts..getPersonByID" is not implemented yet.');
	};
	api.removeGroup = function(){
		console.debug('Method "Titanium.Contacts..removeGroup" is not implemented yet.');
	};
	api.removePerson = function(){
		console.debug('Method "Titanium.Contacts..removePerson" is not implemented yet.');
	};
	api.revert = function(){
		console.debug('Method "Titanium.Contacts..revert" is not implemented yet.');
	};
	api.save = function(){
		console.debug('Method "Titanium.Contacts..save" is not implemented yet.');
	};
	api.showContacts = function(){
		console.debug('Method "Titanium.Contacts..showContacts" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Contacts'));