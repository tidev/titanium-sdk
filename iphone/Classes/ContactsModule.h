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
	ABPeoplePickerNavigationController *picker;
	BOOL pickerAnimated;
	KrollCallback *pickerSuccessCallback;
	KrollCallback *pickerCancelCallback;
	KrollCallback *pickerErrorCallback;
	NSMutableArray *pickerFields;
}

@property(nonatomic,readonly) NSString *ADDRESS_STREET_1;
@property(nonatomic,readonly) NSString *ADDRESS_STREET_2;
@property(nonatomic,readonly) NSString *ADDRESS_CITY;
@property(nonatomic,readonly) NSString *ADDRESS_STATE;
@property(nonatomic,readonly) NSString *ADDRESS_PROVINCE;
@property(nonatomic,readonly) NSString *ADDRESS_SECONDARY_REGION;
@property(nonatomic,readonly) NSString *ADDRESS_ZIP;
@property(nonatomic,readonly) NSString *ADDRESS_POSTAL_CODE;
@property(nonatomic,readonly) NSString *ADDRESS_COUNTRY;
@property(nonatomic,readonly) NSString *ADDRESS_COUNTRY_CODE;

-(id)saveContact:(id)arg;
-(id)removeContact:(id)arg;

#pragma mark Framework
-(ABRecordRef)recordForId:(ABRecordID)rec;

@end

#endif