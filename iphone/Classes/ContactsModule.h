/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS

#import "TiContactsPerson.h"
#import <Contacts/Contacts.h>
#import <ContactsUI/ContactsUI.h>
#import <TitaniumKit/KrollCallback.h>
#import <TitaniumKit/TiModule.h>

@interface ContactsModule : TiModule <CNContactPickerDelegate, CNContactViewControllerDelegate, TiContactsPersonUpdateObserver> {
  @private
  BOOL needsContactStoreFetch;
  BOOL animated;
  BOOL _includeNote;
  KrollCallback *cancelCallback;
  KrollCallback *selectedPersonCallback;
  KrollCallback *selectedPropertyCallback;
  CNContactStore *contactStore;
  CNContactPickerViewController *contactPicker;
  CNSaveRequest *saveRequest;
}

- (CNContactStore *)contactStore;
+ (NSArray *)contactKeysWithImage;
+ (NSArray *)contactKeysWithoutImage;
- (void)save:(id)unusued;
- (void)revert:(id)unused;
- (void)showContacts:(id)args;
- (NSArray *)getPeopleWithName:(id)arg;
- (NSArray *)getAllPeople:(id)unused;
- (TiContactsPerson *)createPerson:(id)arg;
- (void)removePerson:(id)arg;
- (void)requestContactsPermissions:(id)args;

@property (nonatomic, readonly) NSNumber *contactsAuthorization;

@property (nonatomic, readonly) NSNumber *CONTACTS_KIND_PERSON;
@property (nonatomic, readonly) NSNumber *CONTACTS_KIND_ORGANIZATION;

@property (nonatomic, readonly) NSNumber *CONTACTS_SORT_FIRST_NAME;
@property (nonatomic, readonly) NSNumber *CONTACTS_SORT_LAST_NAME;

@property (nonatomic, readonly) NSNumber *AUTHORIZATION_AUTHORIZED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_DENIED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_RESTRICTED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_UNKNOWN; // We still need the 'authorization unknown' constant, though.

@end

#endif
