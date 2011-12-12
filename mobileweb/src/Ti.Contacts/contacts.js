(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.propReadOnly(api, {
		CONTACTS_KIND_ORGANIZATION: 0,
		CONTACTS_KIND_PERSON: 1,
		CONTACTS_SORT_FIRST_NAME: 2,
		CONTACTS_SORT_LAST_NAME: 3
	});

	// Methods
	api.createGroup = function(){
		console.debug('Method "Titanium.Contacts.createGroup" is not implemented yet.');
	};
	api.createPerson = function(){
		console.debug('Method "Titanium.Contacts.createPerson" is not implemented yet.');
	};
	api.getAllGroups = function(){
		console.debug('Method "Titanium.Contacts.getAllGroups" is not implemented yet.');
	};
	api.getAllPeople = function(){
		console.debug('Method "Titanium.Contacts.getAllPeople" is not implemented yet.');
	};
	api.getGroupByID = function(){
		console.debug('Method "Titanium.Contacts.getGroupByID" is not implemented yet.');
	};
	api.getPeopleWithName = function(){
		console.debug('Method "Titanium.Contacts.getPeopleWithName" is not implemented yet.');
	};
	api.getPersonByID = function(){
		console.debug('Method "Titanium.Contacts.getPersonByID" is not implemented yet.');
	};
	api.removeGroup = function(){
		console.debug('Method "Titanium.Contacts.removeGroup" is not implemented yet.');
	};
	api.removePerson = function(){
		console.debug('Method "Titanium.Contacts.removePerson" is not implemented yet.');
	};
	api.revert = function(){
		console.debug('Method "Titanium.Contacts.revert" is not implemented yet.');
	};
	api.save = function(){
		console.debug('Method "Titanium.Contacts.save" is not implemented yet.');
	};
	api.showContacts = function(){
		console.debug('Method "Titanium.Contacts.showContacts" is not implemented yet.');
	};
})(Ti._5.createClass("Ti.Contacts"));