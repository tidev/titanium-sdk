/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ContactsModule.h"

#import <AddressBook/AddressBook.h>
#import <AddressBookUI/AddressBookUI.h>

@interface AddressPickerProxy : TitaniumProxyObject
{
}

@end

@implementation AddressPickerProxy

- (id) init
{
	if ((self = [super init])){
	}
	return self;
}

- (void) dealloc
{
	[super dealloc];
}

@end

@implementation ContactsModule

- (id) getContactRefs: (NSArray *) args;
{
//Args is unused.

	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	CFArrayRef ourContactArray = ABAddressBookCopyArrayOfAllPeople(ourAddyBook);

	NSMutableString * result = [NSMutableString stringWithString:@"["];

	int count = CFArrayGetCount(ourContactArray);
	for (int thisIndex=0; thisIndex<count; thisIndex++) {
		ABRecordRef thisPerson = CFArrayGetValueAtIndex(ourContactArray, thisIndex);
		ABRecordID thisPersonID = ABRecordGetRecordID(thisPerson);
		if (thisIndex==0) {
			[result appendFormat:@"%d",thisPersonID];
		} else {
			[result appendFormat:@",%d",thisPersonID];
		}
	}

	[result appendString:@"]"];

	CFRelease(ourContactArray);
	CFRelease(ourAddyBook);
	
	return [TitaniumJSCode codeWithString:result];
}

- (id) showPicker: (NSArray *) args;
{
	return nil;
}

- (id) getContactProperty: (NSArray *) args;
{

	return nil;
}

- (id) removeContact: (NSArray *) args;
{
	return nil;
}

- (id) addContact: (NSArray *) args;
{
	return nil;
}

- (id) saveContacts: (NSArray *) args;
{
	return nil;
}



#pragma mark startModule

- (BOOL) startModule
{
//	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(TemplateModule *)invocGen foo];
//	NSInvocation * fooInvoc = [invocGen invocation];
	
	TitaniumJSCode * contactObjectCode = [TitaniumJSCode codeWithString:
			@"function(newRefID){this._REFID=newRefID;this._CACHE={};this._DELTA={};return this;}"];
	[contactObjectCode setEpilogueCode:@"Ti.Contacts._CONOBJ.prototype={"
				"getFirstName:function(){"
					"var A=this._DELTA.firstName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.firstName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'firstName']);"
						"this._CACHE.firstName=A;}"
					"return A;"
				"},"
				"setFirstName:function(val){this._DELTA.firstName=val;return val;},"

				"getLastName:function(){"
					"var A=this._DELTA.lastName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.lastName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'lastName']);"
						"this._CACHE.lastName=A;}"
					"return A;"
				"},"
				"setLastName:function(val){this._DELTA.lastName=val;return val;},"

				"getMiddleName:function(){"
					"var A=this._DELTA.middleName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.middleName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'middleName']);"
						"this._CACHE.middleName=A;}"
					"return A;"
				"},"
				"setMiddleName:function(val){this._DELTA.middleName=val;return val;},"

				"getPrefix:function(){"
					"var A=this._DELTA.prefix;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.prefix;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'prefix']);"
						"this._CACHE.prefix=A;}"
					"return A;"
				"},"
				"setPrefix:function(val){this._DELTA.prefix=val;return val;},"

				"getSuffix:function(){"
					"var A=this._DELTA.suffix;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.suffix;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'suffix']);"
						"this._CACHE.suffix=A;}"
					"return A;"
				"},"
				"setSuffix:function(val){this._DELTA.suffix=val;return val;},"

				"getNickname:function(){"
					"var A=this._DELTA.nickname;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.nickname;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'nickname']);"
						"this._CACHE.nickname=A;}"
					"return A;"
				"},"
				"setNickname:function(val){this._DELTA.nickname=val;return val;},"

				"getPhoneticFirstName:function(){"
					"var A=this._DELTA.phoneticFirstName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.phoneticFirstName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'phoneticFirstName']);"
						"this._CACHE.phoneticFirstName=A;}"
					"return A;"
				"},"
				"setPhoneticFirstName:function(val){this._DELTA.phoneticFirstName=val;return val;},"

				"getPhoneticLastName:function(){"
					"var A=this._DELTA.phoneticLastName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.phoneticLastName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'phoneticLastName']);"
						"this._CACHE.phoneticLastName=A;}"
					"return A;"
				"},"
				"setPhoneticLastName:function(val){this._DELTA.phoneticLastName=val;return val;},"

				"getPhoneticMiddleName:function(){"
					"var A=this._DELTA.phoneticMiddleName;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.phoneticMiddleName;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'phoneticMiddleName']);"
						"this._CACHE.phoneticMiddleName=A;}"
					"return A;"
				"},"
				"setPhoneticMiddleName:function(val){this._DELTA.phoneticMiddleName=val;return val;},"

				"getOrganization:function(){"
					"var A=this._DELTA.organization;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.organization;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'organization']);"
						"this._CACHE.organization=A;}"
					"return A;"
				"},"
				"setOrganization:function(val){this._DELTA.organization=val;return val;},"

				"getJobTitle:function(){"
					"var A=this._DELTA.jobTitle;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.jobTitle;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'jobTitle']);"
						"this._CACHE.jobTitle=A;}"
					"return A;"
				"},"
				"setJobTitle:function(val){this._DELTA.jobTitle=val;return val;},"

				"getDepartment:function(){"
					"var A=this._DELTA.department;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.department;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'department']);"
						"this._CACHE.department=A;}"
					"return A;"
				"},"
				"setDepartment:function(val){this._DELTA.department=val;return val;},"

				"getEmail:function(){"
					"var A=this._DELTA.email;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.email;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'email']);"
						"this._CACHE.email=A;}"
					"return A;"
				"},"
				"setEmail:function(val){this._DELTA.email=val;return val;},"

				"getBirthday:function(){"
					"var A=this._DELTA.birthday;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.birthday;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'birthday']);"
						"this._CACHE.birthday=A;}"
					"return A;"
				"},"
				"setBirthday:function(val){this._DELTA.birthday=val;return val;},"

				"getNote:function(){"
					"var A=this._DELTA.note;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.note;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'note']);"
						"this._CACHE.note=A;}"
					"return A;"
				"},"
				"setNote:function(val){this._DELTA.note=val;return val;},"

				"getCreationDate:function(){"
					"var A=this._DELTA.creationDate;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.creationDate;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'creationDate']);"
						"this._CACHE.creationDate=A;}"
					"return A;"
				"},"
				"setCreationDate:function(val){this._DELTA.creationDate=val;return val;},"

				"getModificationDate:function(){"
					"var A=this._DELTA.modificationDate;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.modificationDate;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'modificationDate']);"
						"this._CACHE.modificationDate=A;}"
					"return A;"
				"},"
				"setModificationDate:function(val){this._DELTA.modificationDate=val;return val;},"

				"getImageData:function(){"
					"var A=this._DELTA.imageData;"
					"if(A!==undefined)return A;"
					"A=this._CACHE.imageData;"
					"if((A===undefined)&&(this._REFID)){"
						"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'imageData']);"
						"this._CACHE.imageData=A;}"
					"return A;"
				"},"
				"setImageData:function(val){this._DELTA.imageData=val;return val;},"

			 "};"
			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('firstName',Ti.Contacts._CONOBJ.prototype.getFirstName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('firstName',Ti.Contacts._CONOBJ.prototype.setFirstName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('lastName',Ti.Contacts._CONOBJ.prototype.getLastName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('lastName',Ti.Contacts._CONOBJ.prototype.setLastName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('middleName',Ti.Contacts._CONOBJ.prototype.getMiddleName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('middleName',Ti.Contacts._CONOBJ.prototype.setMiddleName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('prefix',Ti.Contacts._CONOBJ.prototype.getPrefix);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('prefix',Ti.Contacts._CONOBJ.prototype.setPrefix);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('suffix',Ti.Contacts._CONOBJ.prototype.getSuffix);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('suffix',Ti.Contacts._CONOBJ.prototype.setSuffix);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('nickname',Ti.Contacts._CONOBJ.prototype.getNickname);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('nickname',Ti.Contacts._CONOBJ.prototype.setNickname);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('phoneticFirstName',Ti.Contacts._CONOBJ.prototype.getPhoneticFirstName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('phoneticFirstName',Ti.Contacts._CONOBJ.prototype.setPhoneticFirstName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('phoneticLastName',Ti.Contacts._CONOBJ.prototype.getPhoneticLastName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('phoneticLastName',Ti.Contacts._CONOBJ.prototype.setPhoneticLastName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('phoneticMiddleName',Ti.Contacts._CONOBJ.prototype.getPhoneticMiddleName);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('phoneticMiddleName',Ti.Contacts._CONOBJ.prototype.setPhoneticMiddleName);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('organization',Ti.Contacts._CONOBJ.prototype.getOrganization);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('organization',Ti.Contacts._CONOBJ.prototype.setOrganization);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('jobTitle',Ti.Contacts._CONOBJ.prototype.getJobTitle);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('jobTitle',Ti.Contacts._CONOBJ.prototype.setJobTitle);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('department',Ti.Contacts._CONOBJ.prototype.getDepartment);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('department',Ti.Contacts._CONOBJ.prototype.setDepartment);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('email',Ti.Contacts._CONOBJ.prototype.getEmail);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('email',Ti.Contacts._CONOBJ.prototype.setEmail);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('birthday',Ti.Contacts._CONOBJ.prototype.getBirthday);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('birthday',Ti.Contacts._CONOBJ.prototype.setBirthday);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('note',Ti.Contacts._CONOBJ.prototype.getNote);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('note',Ti.Contacts._CONOBJ.prototype.setNote);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('creationDate',Ti.Contacts._CONOBJ.prototype.getCreationDate);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('creationDate',Ti.Contacts._CONOBJ.prototype.setCreationDate);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('modificationDate',Ti.Contacts._CONOBJ.prototype.getModificationDate);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('modificationDate',Ti.Contacts._CONOBJ.prototype.setModificationDate);"

			 "Ti.Contacts._CONOBJ.prototype.__defineGetter__('imageData',Ti.Contacts._CONOBJ.prototype.getImageData);"
			 "Ti.Contacts._CONOBJ.prototype.__defineSetter__('imageData',Ti.Contacts._CONOBJ.prototype.setImageData);"

			 ];

	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			contactObjectCode,@"_CONOBJ",			
			[NSNumber numberWithInt:0],@"_COUNTER",
			[TitaniumJSCode codeWithString:@"{}"],@"_PICKER",
			[TitaniumJSCode codeWithString:@"function(){var refs=Ti._TIDO('contacts','getContactRefs');"
				"var len=refs.length;var res=[];var ob=Ti.Contacts._CONOBJ;for(var i=0;i<len;i++){"
					"res.push(new ob(refs[i]));}return res;}"],@"getAllContacts",
			[TitaniumJSCode codeWithString:@"function(options){var tkn='ADR'+Ti.Contacts._COUNTER++;Ti.Contacts._PICKER[tkn]=options;"
				"Ti._TIDO('contacts','showPicker',[tkn,options.details]);}"],@"showContactPicker",
			[TitaniumJSCode codeWithString:@"function(options){var res=new Ti.Contacts._CONOBJ();"
				"for(prop in options){res._DELTA[prop]=options[prop];}return res;}"],@"createContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(contact._REFID && "
				"Ti._TIDO('contacts','removeContact',[contact._REFID])){delete contact._REFID;}"
				"else{throw 'Contact does not exist in the address book.'}}"],@"removeContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(!contact._REFID)"
				"{contact._REFID=Ti._TIDO('contacts','addContact',[contact._DELTA]);contact._DELTA={};}"
				"else{throw 'Contact already exists in the address book.'}}"],@"addContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(contact._REFID)"
				"{Ti._TIDO('contacts','saveContact',[contact._REFID,contact._DELTA]);contact._DELTA={};}"
				"else{throw 'Contact must be added to the address book first.';}}"],@"saveContact",
			nil];
	[[TitaniumHost sharedHost] bindObject:moduleDict toKeyPath:@"Contacts"];
	
	return YES;
}

@end
