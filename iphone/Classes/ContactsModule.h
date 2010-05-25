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

@interface ContactsModule : TiModule<ABPeoplePickerNavigationControllerDelegate> {
@private
	ABAddressBookRef addressBook;
	ABPeoplePickerNavigationController* picker;
	
	BOOL animated;
	KrollCallback* cancelCallback;
	KrollCallback* selectedPersonCallback;
	KrollCallback* selectedPropertyCallback;
}

-(ABAddressBookRef)addressBook;

-(void)showContacts:(id)args;

-(void)save:(id)unused;
-(void)revert:(id)unused;

@end

#endif