/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TitaniumModule.h"
#import <AddressBook/AddressBook.h>


@interface ContactsModule : NSObject<TitaniumModule> {
	int nextContactPickerToken;
	NSMutableDictionary * contactPickerLookup;
	ABAddressBookRef sharedAddressBook;
}

/*

 @tiapi(property=true,name=Contacts.ADDRESS_STREET_1,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the first street line in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_STREET_1].
 
 @tiapi(property=true,name=Contacts.ADDRESS_STREET_2,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the second street line in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_STREET_2].
 
 @tiapi(property=true,name=Contacts.ADDRESS_CITY,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the city name in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_CITY].
 
 @tiapi(property=true,name=Contacts.ADDRESS_STATE,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the state name in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_STATE]. Identical to ADDRESS_PROVINCE.
 
 @tiapi(property=true,name=Contacts.ADDRESS_PROVINCE,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the province name in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_PROVINCE]. Identical to ADDRESS_STATE.
 
 @tiapi(property=true,name=Contacts.ADDRESS_SECONDARY_REGION,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . This field is used by only a few countries. To get the region name in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_SECONDARY_REGION].
 
 @tiapi(property=true,name=Contacts.ADDRESS_ZIP,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the zip code in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_ZIP]. Identical to ADDRESS_POSTAL_CODE.
 
 @tiapi(property=true,name=Contacts.ADDRESS_POSTAL_CODE,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the postal code in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_POSTAL_CODE]. Identical to ADDRESS_ZIP.
 
 @tiapi(property=true,name=Contacts.ADDRESS_COUNTRY,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the country name in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_COUNTRY].
 
 @tiapi(property=true,name=Contacts.ADDRESS_COUNTRY_CODE,since=0.8,type=String)
 @tiapi  Convenience key to use with an address entry in Contacts.Contact . To get the country code in the first address of a Contact.Contact called 'myContact', use myContact.address[0].value[ADDRESS_COUNTRY_CODE].
 
 @tiapi(method=true,name=Contacts.showContactPicker,since=0.8)
 @tiarg[options,Object] (object)
 @tiarg  Contains the callbacks and options
 @tiapi(method=true,name=Contacts.getAllContacts,since=0.8)
 @tiresult[Array<Object>] (array of Contacts.Contacts)
 @tiapi(method=true,name=Contacts.removeContact,since=0.8)
 @tiarg[contact,Object] (Contacts.Contact)
 @tiarg  The contact to remove.
 @tiapi(method=true,name=Contacts.addContact,since=0.8)
 @tiarg[contact,Object] (Contacts.Contact)
 @tiarg  The contact to add.
 @tiapi(method=true,name=Contacts.saveContact,since=0.8)
 @tiarg[contact,Object] (Contacts.Contact)
 @tiarg  The contact to save.
 @tiapi(method=true,name=Contacts.createContact,since=0.8)
 @tiapi Creates a new Contacts.Contact object
 @tiarg[args,Object,optional=true] (optional object)
 @tiarg  can contain various properties that will be copied into the new object on initialization.
 @tiresult[Object] The created Contacts.Contact.
 @tiapi(property=true,name=Contacts.Contact.FirstName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getFirstName,since=0.8)
 @tiapi retrieves the Contacts.Contact.FirstName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setFirstName,since=0.8)
 @tiapi saves the Contacts.Contact.FirstName property
 @tiarg[String,newFirstName] The new string.
 @tiapi(property=true,name=Contacts.Contact.LastName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getLastName,since=0.8)
 @tiapi retrieves the Contacts.Contact.LastName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setLastName,since=0.8)
 @tiapi saves the Contacts.Contact.LastName property
 @tiarg[String,newLastName] The new string.
 @tiapi(property=true,name=Contacts.Contact.middleName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getMiddleName,since=0.8)
 @tiapi retrieves the Contacts.Contact.middleName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setMiddleName,since=0.8)
 @tiapi saves the Contacts.Contact.middleName property
 @tiarg[String,newMiddleName] The new string.
 @tiapi(property=true,name=Contacts.Contact.prefix,since=0.8,type=String) (string)
 @tiapi  The text that preceeds the contact's name, such as Dr for doctor.
 @tiapi(method=true,name=Contacts.Contact.getPrefix,since=0.8)
 @tiapi retrieves the Contacts.Contact.prefix property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setPrefix,since=0.8)
 @tiapi saves the Contacts.Contact.prefix property
 @tiarg[String,newPrefix] The new string.
 @tiapi(property=true,name=Contacts.Contact.suffix,since=0.8,type=String) (string)
 @tiapi  The text that follows the contact's name, such as Jr, Sr.
 @tiapi(method=true,name=Contacts.Contact.getSuffix,since=0.8)
 @tiapi retrieves the Contacts.Contact.suffix property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setSuffix,since=0.8)
 @tiapi saves the Contacts.Contact.suffix property
 @tiarg[String,newSuffix] The new string.
 @tiapi(property=true,name=Contacts.Contact.nickname,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getNickname,since=0.8)
 @tiapi retrieves the Contacts.Contact.nickname property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setNickname,since=0.8)
 @tiapi saves the Contacts.Contact.nickname property
 @tiarg[String,newNickname] The new string.
 @tiapi(property=true,name=Contacts.Contact.phoneticFirstName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getPhoneticFirstName,since=0.8)
 @tiapi retrieves the Contacts.Contact.phoneticFirstName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setPhoneticFirstName,since=0.8)
 @tiapi saves the Contacts.Contact.phoneticFirstName property
 @tiarg[String,newPhoneticFirstName] The new string.
 @tiapi(property=true,name=Contacts.Contact.phoneticLastName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getPhoneticLastName,since=0.8)
 @tiapi retrieves the Contacts.Contact.phoneticLastName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setPhoneticLastName,since=0.8)
 @tiapi saves the Contacts.Contact.phoneticLastName property
 @tiarg[String,newPhoneticLastName] The new string.
 @tiapi(property=true,name=Contacts.Contact.phoneticMiddleName,since=0.8,type=String) (string)
 @tiapi(method=true,name=Contacts.Contact.getPhoneticMiddleName,since=0.8)
 @tiapi retrieves the Contacts.Contact.phoneticMiddleName property
 @tiresult[String] The current string.
 @tiapi(method=true,name=Contacts.Contact.setPhoneticMiddleName,since=0.8)
 @tiapi saves the Contacts.Contact.phoneticMiddleName property
 @tiarg[String,newPhoneticMiddleName] The new string.
 @tiapi(property=true,name=Contacts.Contact.organization,since=0.8,type=Array<Label/Value pair<Object>>) (multivalue of objects)
 @tiapi  For consistency, organization is a multivalue. However, for the iPhone, only the organization[0].value properties are saved.
 @tiapi(method=true,name=Contacts.Contact.getOrganization,since=0.8)
 @tiapi retrieves the Contacts.Contact.organization property
 @tiresult[Array<Label/Value pair<Object>>] The current multivalue of objects.
 @tiapi(method=true,name=Contacts.Contact.setOrganization,since=0.8)
 @tiapi saves the Contacts.Contact.organization property
 @tiarg[Array<Label/Value pair<Object>>,newOrganization] The new multivalue of objects.
 @tiapi(property=true,name=Contacts.Contact.email,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi(method=true,name=Contacts.Contact.getEmail,since=0.8)
 @tiapi retrieves the Contacts.Contact.email property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setEmail,since=0.8)
 @tiapi saves the Contacts.Contact.email property
 @tiarg[Array<Label/Value pair<String>>,newEmail] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.birthday,since=0.8,type=Date) (date)
 @tiapi(method=true,name=Contacts.Contact.getBirthday,since=0.8)
 @tiapi retrieves the Contacts.Contact.birthday property
 @tiresult[Date] The current date.
 @tiapi(method=true,name=Contacts.Contact.setBirthday,since=0.8)
 @tiapi saves the Contacts.Contact.birthday property
 @tiarg[Date,newBirthday] The new date.
 @tiapi(property=true,name=Contacts.Contact.note,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi  For consistency, note is a multivalue. However, for the iPhone, only the note[0].value property is saved.
 @tiapi(method=true,name=Contacts.Contact.getNote,since=0.8)
 @tiapi retrieves the Contacts.Contact.note property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setNote,since=0.8)
 @tiapi saves the Contacts.Contact.note property
 @tiarg[Array<Label/Value pair<String>>,newNote] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.creationDate,since=0.8,type=Date) (date)
 @tiapi(method=true,name=Contacts.Contact.getCreationDate,since=0.8)
 @tiapi retrieves the Contacts.Contact.creationDate property
 @tiresult[Date] The current date.
 @tiapi(method=true,name=Contacts.Contact.setCreationDate,since=0.8)
 @tiapi saves the Contacts.Contact.creationDate property
 @tiarg[Date,newCreationDate] The new date.
 @tiapi(property=true,name=Contacts.Contact.modificationDate,since=0.8,type=Date) (date)
 @tiapi(method=true,name=Contacts.Contact.getModificationDate,since=0.8)
 @tiapi retrieves the Contacts.Contact.modificationDate property
 @tiresult[Date] The current date.
 @tiapi(method=true,name=Contacts.Contact.setModificationDate,since=0.8)
 @tiapi saves the Contacts.Contact.modificationDate property
 @tiarg[Date,newModificationDate] The new date.
 @tiapi(property=true,name=Contacts.Contact.imageData,since=0.8,type=Object) (dataBlob)
 @tiapi  represents the image that is displayed to the left of the name in the contacts picker.
 @tiapi(method=true,name=Contacts.Contact.getImageData,since=0.8)
 @tiapi retrieves the Contacts.Contact.imageData property
 @tiresult[Object] The current dataBlob.
 @tiapi(method=true,name=Contacts.Contact.setImageData,since=0.8)
 @tiapi saves the Contacts.Contact.imageData property
 @tiarg[Object,newImageData] The new dataBlob.
 @tiapi(property=true,name=Contacts.Contact.address,since=0.8,type=Array<Label/Value pair<Object>>) (multivalue of objects)
 @tiapi  See the constants in the Contacts module for the possible properties of an address object. Note that address may have a different format in some versions of Android.
 @tiapi(method=true,name=Contacts.Contact.getAddress,since=0.8)
 @tiapi retrieves the Contacts.Contact.address property
 @tiresult[Array<Label/Value pair<Object>>] The current multivalue of objects.
 @tiapi(method=true,name=Contacts.Contact.setAddress,since=0.8)
 @tiapi saves the Contacts.Contact.address property
 @tiarg[Array<Label/Value pair<Object>>,newAddress] The new multivalue of objects.
 @tiapi(property=true,name=Contacts.Contact.date,since=0.8,type=Array<Label/Value pair<Date>>) (multivalue of dates)
 @tiapi(method=true,name=Contacts.Contact.getDate,since=0.8)
 @tiapi retrieves the Contacts.Contact.date property
 @tiresult[Array<Label/Value pair<Date>>] The current multivalue of dates.
 @tiapi(method=true,name=Contacts.Contact.setDate,since=0.8)
 @tiapi saves the Contacts.Contact.date property
 @tiarg[Array<Label/Value pair<Date>>,newDate] The new multivalue of dates.
 @tiapi(property=true,name=Contacts.Contact.phone,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi(method=true,name=Contacts.Contact.getPhone,since=0.8)
 @tiapi retrieves the Contacts.Contact.phone property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setPhone,since=0.8)
 @tiapi saves the Contacts.Contact.phone property
 @tiarg[Array<Label/Value pair<String>>,newPhone] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.instantMessenger,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi(method=true,name=Contacts.Contact.getInstantMessenger,since=0.8)
 @tiapi retrieves the Contacts.Contact.instantMessenger property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setInstantMessenger,since=0.8)
 @tiapi saves the Contacts.Contact.instantMessenger property
 @tiarg[Array<Label/Value pair<String>>,newInstantMessenger] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.url,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi(method=true,name=Contacts.Contact.getUrl,since=0.8)
 @tiapi retrieves the Contacts.Contact.url property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setUrl,since=0.8)
 @tiapi saves the Contacts.Contact.url property
 @tiarg[Array<Label/Value pair<String>>,newUrl] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.relatives,since=0.8,type=Array<Label/Value pair<String>>) (multivalue of strings)
 @tiapi(method=true,name=Contacts.Contact.getRelatives,since=0.8)
 @tiapi retrieves the Contacts.Contact.relatives property
 @tiresult[Array<Label/Value pair<String>>] The current multivalue of strings.
 @tiapi(method=true,name=Contacts.Contact.setRelatives,since=0.8)
 @tiapi saves the Contacts.Contact.relatives property
 @tiarg[Array<Label/Value pair<String>>,newRelatives] The new multivalue of strings.
 @tiapi(property=true,name=Contacts.Contact.displayLabel,since=0.8,type=String|Object) (read-only string)
 @tiapi  Accessor returns displayName if it is defined. Else, returns organization[0].value.company if is defined. Else, returns phone[0].value if it is defined. Else, returns 'No Name'.
 @tiapi(method=true,name=Contacts.Contact.getDisplayLabel,since=0.8)
 @tiapi retrieves the Contacts.Contact.displayLabel property
 @tiresult[String|Object] The current read-only string.
 @tiapi(property=true,name=Contacts.Contact.displayName,since=0.8,type=String|Object) (read-only string)
 @tiapi  Accessor returns prefix + firstName + middleName + lastName + suffix.
 @tiapi(method=true,name=Contacts.Contact.getDisplayName,since=0.8)
 @tiapi retrieves the Contacts.Contact.displayName property
 @tiresult[String|Object] The current read-only string.
 @tiapi(property=true,name=Contacts.Contact.displayPhoneticName,since=0.8,type=String|Object) (read-only string)
 @tiapi  Accessor returns prefix + phoneticFirstName + phoneticMiddleName + phoneticLastName + suffix.
 @tiapi(method=true,name=Contacts.Contact.getDisplayPhoneticName,since=0.8)
 @tiapi retrieves the Contacts.Contact.displayPhoneticName property
 @tiresult[String|Object] The current read-only string.


*/

@end
