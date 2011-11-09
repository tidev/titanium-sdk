(function(api){
	// Properties
	var _URL = null;
	Object.defineProperty(api, 'URL', {
		get: function(){return _URL;},
		set: function(val){return _URL = val;}
	});

	var _address = null;
	Object.defineProperty(api, 'address', {
		get: function(){return _address;},
		set: function(val){return _address = val;}
	});

	var _birthday = null;
	Object.defineProperty(api, 'birthday', {
		get: function(){return _birthday;},
		set: function(val){return _birthday = val;}
	});

	var _created = null;
	Object.defineProperty(api, 'created', {
		get: function(){return _created;},
		set: function(val){return _created = val;}
	});

	var _date = null;
	Object.defineProperty(api, 'date', {
		get: function(){return _date;},
		set: function(val){return _date = val;}
	});

	var _department = null;
	Object.defineProperty(api, 'department', {
		get: function(){return _department;},
		set: function(val){return _department = val;}
	});

	var _email = null;
	Object.defineProperty(api, 'email', {
		get: function(){return _email;},
		set: function(val){return _email = val;}
	});

	var _firstName = null;
	Object.defineProperty(api, 'firstName', {
		get: function(){return _firstName;},
		set: function(val){return _firstName = val;}
	});

	var _firstPhonetic = null;
	Object.defineProperty(api, 'firstPhonetic', {
		get: function(){return _firstPhonetic;},
		set: function(val){return _firstPhonetic = val;}
	});

	var _fullName = null;
	Object.defineProperty(api, 'fullName', {
		get: function(){return _fullName;},
		set: function(val){return _fullName = val;}
	});

	var _image = null;
	Object.defineProperty(api, 'image', {
		get: function(){return _image;},
		set: function(val){return _image = val;}
	});

	var _instantMessage = null;
	Object.defineProperty(api, 'instantMessage', {
		get: function(){return _instantMessage;},
		set: function(val){return _instantMessage = val;}
	});

	var _jobTitle = null;
	Object.defineProperty(api, 'jobTitle', {
		get: function(){return _jobTitle;},
		set: function(val){return _jobTitle = val;}
	});

	var _kind = null;
	Object.defineProperty(api, 'kind', {
		get: function(){return _kind;},
		set: function(val){return _kind = val;}
	});

	var _lastName = null;
	Object.defineProperty(api, 'lastName', {
		get: function(){return _lastName;},
		set: function(val){return _lastName = val;}
	});

	var _lastPhonetic = null;
	Object.defineProperty(api, 'lastPhonetic', {
		get: function(){return _lastPhonetic;},
		set: function(val){return _lastPhonetic = val;}
	});

	var _middleName = null;
	Object.defineProperty(api, 'middleName', {
		get: function(){return _middleName;},
		set: function(val){return _middleName = val;}
	});

	var _middlePhonetic = null;
	Object.defineProperty(api, 'middlePhonetic', {
		get: function(){return _middlePhonetic;},
		set: function(val){return _middlePhonetic = val;}
	});

	var _modified = null;
	Object.defineProperty(api, 'modified', {
		get: function(){return _modified;},
		set: function(val){return _modified = val;}
	});

	var _nickname = null;
	Object.defineProperty(api, 'nickname', {
		get: function(){return _nickname;},
		set: function(val){return _nickname = val;}
	});

	var _note = null;
	Object.defineProperty(api, 'note', {
		get: function(){return _note;},
		set: function(val){return _note = val;}
	});

	var _organization = null;
	Object.defineProperty(api, 'organization', {
		get: function(){return _organization;},
		set: function(val){return _organization = val;}
	});

	var _phone = null;
	Object.defineProperty(api, 'phone', {
		get: function(){return _phone;},
		set: function(val){return _phone = val;}
	});

	var _prefix = null;
	Object.defineProperty(api, 'prefix', {
		get: function(){return _prefix;},
		set: function(val){return _prefix = val;}
	});

	var _relatedNames = null;
	Object.defineProperty(api, 'relatedNames', {
		get: function(){return _relatedNames;},
		set: function(val){return _relatedNames = val;}
	});

	var _suffix = null;
	Object.defineProperty(api, 'suffix', {
		get: function(){return _suffix;},
		set: function(val){return _suffix = val;}
	});

})(Ti._5.createClass('Titanium.Contacts.Person'));