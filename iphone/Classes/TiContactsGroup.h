/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CONTACTS
#import "ContactsModule.h"
#import <AddressBook/AddressBook.h>
#import <Contacts/Contacts.h>

@interface TiContactsGroup : TiProxy {
  ABRecordRef record;
  ABRecordID recordId;
  CNMutableGroup *group;
  ContactsModule *module;
  NSString *identifier;
}

@property (readonly, nonatomic) NSNumber *recordId;
@property (readonly, nonatomic) ABRecordRef record;

- (id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule *)module_;
- (id)_initWithPageContext:(id<TiEvaluator>)context contactGroup:(CNMutableGroup *)group_ module:(ContactsModule *)module_;
- (CNSaveRequest *)getSaveRequestForDeletion;
- (CNSaveRequest *)getSaveRequestForAddition:(NSString *)containerIdentifier;

@end
#endif
