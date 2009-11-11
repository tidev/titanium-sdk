/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.Contacts = {
	_module : "TitaniumContacts",

	Contact : function(id) {
		this._id = id;
		this._contact = null;
		this._get = function() {
			if (this._contact === null) {
				this._contact = Ti.Contacts.getContact(this._id);
			}
			return this._contact;
		};

		this.getDisplayLabel = function() {
			var value = this._displayLabel;
			if (value === undefined) {
				value = this._get().displayName;
				this._displayLabel = value;
			}
			return value;
		};

		this.getDisplayName = function() {
			var value = this._displayName;
			if (value === undefined) {
				value = this._get().name;
				this._displayName = value;
			}
			return value;
		};

		this.getDisplayPhoneticName = function() {
			var value = this._displayPhoneticName;
			if (value === undefined) {
				value = this._get().phoneticName;
				this._displayPhoneticName = value;
			}
			return value;
		};

		this.getFirstName = function() {
			return "";
		};

		this.setFirstName = function(value) {

		};

		this.getMiddleName = function() {
			return "";
		};

		this.setMiddleName = function(value) {

		};

		this.getLastName = function() {
			return "";
		};

		this.setLastName = function(value) {

		};

		this.getPrefix = function() {
			return "";
		};

		this.setPrefix = function(value) {

		};

		this.getSuffix = function() {
			return "";
		};

		this.setSuffix = function(value) {

		};

		this.getNickname = function() {
			return "";
		};

		this.setNickname = function(value) {

		};

		this.getFirstNamePhonetic = function() {
			return "";
		};

		this.setFirstNamePhonetic = function(value) {

		};

		this.getMiddleNamePhonetic = function() {
			return "";
		};

		this.setMiddleNamePhonetic = function(value) {
		};

		this.getLastNamePhonetic = function() {
			return "";
		};

		this.setLastNamePhonetic = function() {

		};

		this.getBirthday = function() {
			return "";
		};

		this.setBirthday = function(value) {

		};

		this.getCreationDate = function() {
			return null;
		};

		this.setCreationDate = function(value) {

		};

		this.getModificationDate = function() {
			return null;
		};

		this.setModificationDate = function(value) {

		};

		this.getImageData = function() {
			// TODO
		};

		this.setImageData = function(value) {

		};

		this.getOrganization = function() {
			return this._get().organization;
		};

		this.setOrganization = function(value) {

		};

		this.getPhone = function() {
			return this._get().phone;
		};

		this.setPhone = function(value) {

		};

		this.getAddress = function() {
			return this._get().address;
		};

		this.setAddress = function(value) {

		};

		this.getEmail = function() {
			return this._get().email;
		};

		this.setEmail = function(value) {

		};

		this.getNote = function() {
			return this._get().note;
		};

		this.setNote = function(value) {

		};
	},

	showContact : function(args) {
		Ti.Method.dispatch(this._module, "showContact", args);
	},

	showContactPicker : function(args) {
		if (!Ti.isUndefined(args)) {
			var successHandler = function(e) {
				var id = e.id;
				var contact = new Ti.Contacts.Contact(id);
				contact._contact = e.contact;
				e.contact = contact;

				args.success(e);
			};
			var newArgs = {
				success : registerOneShot(this, successHandler),
				cancel : registerOneShot(this, args.cancel),
				details : args.details
			};
			Ti.Method.dispatch(this._module, "showContactPicker", newArgs);
		}
	},

	getAllContacts : function() {
		var keys = Ti.Method.dispatch(this._module, "getAllContacts");
		var contacts = [];
		for(var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var c = new Ti.Contacts.Contact(key.id);
			c._displayLabel = key.displayLabel;
			c._displayName = key.displayName;
			c._displayPhoneticName = key.displayPhoneticName;
			contacts.push(c);
		}
		return contacts;
	},

	removeContact : function(contact) {
		Ti.Method.dispatch(this._module, "removeContact", contact);
	},

	saveContact : function(contact) {
		Ti.Method.dispatch(this._module, "saveContact", contact);
	},

	addContact : function(contact) {
		Ti.Method.dispatch(this._module, "addContact", contact);
	},

	createContact : function(contactInfo) {
		Ti.Method.dispatch(this._module, "createContact", contactInfo);
	},

	getContact : function(id) {
		return Ti.Method.dispatch(this._module, "getContact", id);
	}

};

// Read-only properties
Ti.Contacts.Contact.prototype.__defineGetter__("displayLabel", function(){
	return this.getDisplayLabel();
});
Ti.Contacts.Contact.prototype.__defineGetter__("displayName", function(){
	return this.getDisplayName();
});
Ti.Contacts.Contact.prototype.__defineGetter__("displayPhoneticName", function(){
	return this.getDisplayPhoneticName();
});

// Read-write properties
Ti.Contacts.Contact.prototype.__defineGetter__("firstName", function(){
	return this.getFirstName();
});
Ti.Contacts.Contact.prototype.__defineSetter__("firstName", function(value){
	this.setFirstName(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("middleName", function(){
	return this.getMiddleName();
});
Ti.Contacts.Contact.prototype.__defineSetter__("middleName", function(value){
	this.setMiddleName(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("lastName", function(){
	return this.getLastName();
});
Ti.Contacts.Contact.prototype.__defineSetter__("lastName", function(value){
	this.setLastName(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("prefix", function(){
	return this.getPrefix();
});
Ti.Contacts.Contact.prototype.__defineSetter__("prefix", function(value){
	this.setPrefix(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("suffix", function(){
	return this.getSuffix();
});
Ti.Contacts.Contact.prototype.__defineSetter__("suffix", function(value){
	this.setSuffix(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("firstNamePhonetic", function(){
	return this.getFirstnamePhonetic();
});
Ti.Contacts.Contact.prototype.__defineSetter__("firstNamePhonetic", function(value){
	this.setFirstNamePhonetic(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("middleNamePhonetic", function(){
	return this.getMiddleNamePhonetic();
});
Ti.Contacts.Contact.prototype.__defineSetter__("middleNamePhonetic", function(value){
	this.setMiddelNamePhonetic(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("lastNamePhonetic", function(){
	return this.getLastNamePhonetic();
});
Ti.Contacts.Contact.prototype.__defineSetter__("lastNamePhonetic", function(value){
	this.setLastNamePhonetic(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("nickname", function(){
	return this.getNickname();
});
Ti.Contacts.Contact.prototype.__defineSetter__("nickname", function(value){
	this.setNickname(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("birthday", function(){
	return this.getBirthday();
});
Ti.Contacts.Contact.prototype.__defineSetter__("birthday", function(value){
	this.setBirthday(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("creationDate", function(){
	return this.getCreationDate();
});
Ti.Contacts.Contact.prototype.__defineSetter__("creationDate", function(value){
	this.setCreationDate(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("modificationDate", function(){
	return this.getModificationDate();
});
Ti.Contacts.Contact.prototype.__defineSetter__("modificationDate", function(value){
	this.setModificationDate(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("imageData", function(){
	return this.getImageData();
});
Ti.Contacts.Contact.prototype.__defineSetter__("imageData", function(value){
	this.setImageData(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("organization", function(){
	return this.getOrganization();
});
Ti.Contacts.Contact.prototype.__defineSetter__("organization", function(value){
	this.setOrganization(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("phone", function(){
	return this.getPhone();
});
Ti.Contacts.Contact.prototype.__defineSetter__("phone", function(value){
	this.setPhone(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("address", function(){
	return this.getAddress();
});
Ti.Contacts.Contact.prototype.__defineSetter__("address", function(value){
	this.setAddress(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("email", function(){
	return this.getEmail();
});
Ti.Contacts.Contact.prototype.__defineSetter__("email", function(value){
	this.setEmail(value);
});

Ti.Contacts.Contact.prototype.__defineGetter__("note", function(){
	return this.getNote();
});
Ti.Contacts.Contact.prototype.__defineSetter__("note", function(value){
	this.setNote(value);
});