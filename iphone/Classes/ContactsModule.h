/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_CONTACTS

#import <AddressBook/AddressBook.h>
#import <AddressBookUI/AddressBookUI.h>

#import "KrollCallback.h"
#import "TiContactsPerson.h"

@interface ContactsModule : TiModule<ABPeoplePickerNavigationControllerDelegate> {
@private
	ABAddressBookRef addressBook;
	ABPeoplePickerNavigationController* picker;
	
	BOOL iOS6API;
	BOOL animated;
	KrollCallback* cancelCallback;
	KrollCallback* selectedPersonCallback;
	KrollCallback* selectedPropertyCallback;
}

-(ABAddressBookRef)addressBook;

-(void)save:(id)unusued;
-(void)revert:(id)unused;
-(void)showContacts:(id)args;
-(TiContactsPerson*)getPersonByID:(id)arg;
-(NSArray*)getPeopleWithName:(id)arg;
-(NSArray*)getAllPeople:(id)unused;
-(TiContactsPerson*)createPerson:(id)arg;
-(void)removePerson:(id)arg;



@property (nonatomic,readonly) NSNumber* contactsAuthorization;
-(void) requestAuthorization:(id)args;

@property (nonatomic,readonly) NSNumber* CONTACTS_KIND_PERSON;
@property (nonatomic,readonly) NSNumber* CONTACTS_KIND_ORGANIZATION;

@property (nonatomic,readonly) NSNumber* CONTACTS_SORT_FIRST_NAME;
@property (nonatomic,readonly) NSNumber* CONTACTS_SORT_LAST_NAME;

@property(nonatomic,readonly) NSNumber* AUTHORIZATION_AUTHORIZED;
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_DENIED;
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_RESTRICTED;
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_UNKNOWN; // We still need the 'authorization unknown' constant, though.

@end

#endif