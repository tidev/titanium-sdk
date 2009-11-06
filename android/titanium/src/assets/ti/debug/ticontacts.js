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

		this.getDisplayName = function() {
			return this._get().displayName;
		};

		this.getName = function() {
			return this._get().name;
		};

		this.getFirstName = function() {
			return "";
		};

		this.getLastName = function() {
			return "";
		};

		this.getMiddleName = function() {
			return "";
		};

		this.getPrefix = function() {
			return "";
		};

		this.getSuffix = function() {
			return "";
		};

		this.getNickname = function() {
			return "";
		};

		this.getPhoneticName = function() {
			return this._get().phoneticName;
		};

		this.getFirstNamePhonetic = function() {
			return "";
		};

		this.getMiddleNamePhonetic = function() {
			return "";
		};

		this.getLastNamePhonetic = function() {
			return "";
		};

		this.getOrganization = function() {
			return this._get().organization;
		};

		this.getBirthday = function() {
			return "";
		};

		this.getCreationDate = function() {
			return null;
		};

		this.getModificationDate = function() {
			return null;
		};

		this.getImageData = function() {
			// TODO
		};

		this.getPhoneNumber = function() {
			return this._get().phone;
		};

		this.getAddress = function() {
			return this._get().address;
		};

		this.getEmail = function() {
			return this._get().email;
		};

		this.getNote = function() {
			return this._get().note;
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
		var ids = Ti.Method.dispatch(this._module, "getAllContacts");
		var contacts = [];
		for(var i = 0; i < ids.length; i++) {
			contacts.push(new Ti.Contacts.Contact(ids[i]));
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