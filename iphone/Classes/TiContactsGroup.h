/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#if !TARGET_OS_MACCATALYST

#ifdef USE_TI_CONTACTS
#import "ContactsModule.h"
#import <AddressBook/AddressBook.h>
#import <Contacts/Contacts.h>

@interface TiContactsGroup : TiProxy {
  CNMutableGroup *group;
  ContactsModule *module;
  NSString *identifier;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context contactGroup:(CNMutableGroup *)group_ module:(ContactsModule *)module_;
- (CNSaveRequest *)getSaveRequestForDeletion;
- (CNSaveRequest *)getSaveRequestForAddition:(NSString *)containerIdentifier;

@end
#endif
#endif
