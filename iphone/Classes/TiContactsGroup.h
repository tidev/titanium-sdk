/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CONTACTS
#import <AddressBook/AddressBook.h>
#import "ContactsModule.h"
#if IS_XCODE_7
#import <Contacts/Contacts.h>
#endif
@interface TiContactsGroup : TiProxy {
	ABRecordRef record;
	ABRecordID recordId;
#if IS_XCODE_7
	CNMutableGroup* group;
#endif
    ContactsModule* module;
	NSString* identifier;
}

@property(readonly,nonatomic) NSNumber* recordId;
@property(readonly,nonatomic) ABRecordRef record;

-(id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule*)module_;
#if IS_XCODE_7
-(id)_initWithPageContext:(id<TiEvaluator>)context contactGroup:(CNMutableGroup*)group_ module:(ContactsModule*)module_;
-(CNSaveRequest*)getSaveRequestForDeletion;
-(CNSaveRequest*)getSaveRequestForAddition: (NSString*)containerIdentifier;
#endif
@end
#endif
