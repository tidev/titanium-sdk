define("Ti/Contacts/Person", ["Ti/_/Evented"], function(Evented) {
	
	(function(api){

		Ti._5.prop(api, {
			address: null,
			birthday: null,
			created: null,
			date: null,
			department: null,
			email: null,
			firstName: null,
			firstPhonetic: null,
			fullName: null,
			image: null,
			instantMessage: null,
			jobTitle: null,
			kind: null,
			lastName: null,
			lastPhonetic: null,
			middleName: null,
			middlePhonetic: null,
			modified: null,
			nickname: null,
			note: null,
			organization: null,
			phone: null,
			prefix: null,
			relatedNames: null,
			suffix: null,
			URL: null
		});
	
	})(Ti._5.createClass("Ti.Contacts.Person"));

});