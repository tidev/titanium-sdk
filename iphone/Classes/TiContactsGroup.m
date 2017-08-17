/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS
#import "TiContactsGroup.h"

@implementation TiContactsGroup

- (ABRecordRef)record
{
  // Force us to be on the main thread
  if (![NSThread isMainThread]) {
    return NULL;
  }

  if (record == NULL) {
    if (recordId != kABRecordInvalidID) {
      ABAddressBookRef ourAddressBook = [module addressBook];
      if (ourAddressBook != NULL) {
        record = ABAddressBookGetGroupWithRecordID(ourAddressBook, recordId);
      }
    }
  }
  return record;
}

- (NSNumber *)recordId
{
  if ([TiUtils isIOS9OrGreater]) {
    DebugLog(@"[WARN] this property is removed for iOS9 and greater.");
    return NULL;
  }
  return NUMINT(recordId);
}

//only for iOS9
- (NSString *)identifier
{
  if ([TiUtils isIOS9OrGreater]) {
    return group.identifier;
  }
  DebugLog(@"[WARN] this property is only used for iOS9 and greater.");
  return NULL;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule *)module_
{
  if (self = [super _initWithPageContext:context]) {
    recordId = id_;
    record = NULL;
    module = module_;
  }
  return self;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context contactGroup:(CNMutableGroup *)group_ module:(ContactsModule *)module_
{
  if (self = [super _initWithPageContext:context]) {
    group = [group_ retain];
    module = module_;
  }
  return self;
}

- (void)dealloc
{
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.Contacts.Group";
}

#pragma mark Public API

- (NSString *)name
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(^{
      result = [[self name] retain];
    },
        YES);
    return [result autorelease];
  }

  if ([TiUtils isIOS9OrGreater]) {
    if ([group name]) {
      return [group name];
    }
    return @"<unamed group>";
  }

  CFStringRef nameRef = ABRecordCopyValue([self record], kABGroupNameProperty);
  NSString *name = @"<unnamed group>";
  if (nameRef != NULL) {
    name = [NSString stringWithString:(NSString *)nameRef];
    CFRelease(nameRef);
  }

  return name;
}

- (void)setName:(id)arg
{
  ENSURE_SINGLE_ARG(arg, NSString)
  ENSURE_UI_THREAD(setName, arg)

  if ([TiUtils isIOS9OrGreater]) {
    group.name = arg;
    return;
  }

  CFErrorRef error;
  if (!ABRecordSetValue([self record], kABGroupNameProperty, (CFStringRef)arg, &error)) {
    CFStringRef reason = CFErrorCopyDescription(error);
    NSString *str = [NSString stringWithString:(NSString *)reason];
    CFRelease(reason);
    [self throwException:[NSString stringWithFormat:@"Failed to set contact property name: %@", str]
               subreason:nil
                location:CODELOCATION];
  }
}

- (NSArray *)members:(id)unused
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(^{
      result = [[self members:unused] retain];
    },
        YES);
    return [result autorelease];
  }

  if ([TiUtils isIOS9OrGreater]) {
    CNContactStore *ourContactStore = [module contactStore];
    if (ourContactStore == NULL) {
      return nil;
    }
    NSError *error = nil;
    NSMutableArray *peopleRefs = nil;
    peopleRefs = [[NSMutableArray alloc] init];
    CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:[ContactsModule contactKeysWithImage]];
    fetchRequest.predicate = [CNContact predicateForContactsInGroupWithIdentifier:[group identifier]];
    BOOL success = [ourContactStore enumerateContactsWithFetchRequest:fetchRequest
                                                                error:&error
                                                           usingBlock:^(CNContact *__nonnull contact, BOOL *__nonnull stop) {
                                                             TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext]
                                                                                                                              contactId:(CNMutableContact *)contact
                                                                                                                                 module:module
                                                                                                                               observer:module] autorelease];
                                                             [peopleRefs addObject:person];
                                                           }];
    if (success) {
      NSArray *people = [NSArray arrayWithArray:peopleRefs];
      RELEASE_TO_NIL(peopleRefs);
      return people;
    } else {
      DebugLog(@"%@", [TiUtils messageFromError:error]);
      return nil;
    }
  }

  CFArrayRef arrayRef = ABGroupCopyArrayOfAllMembers([self record]);
  if (arrayRef == NULL) {
    return nil;
  }
  CFIndex count = CFArrayGetCount(arrayRef);
  NSMutableArray *members = [NSMutableArray arrayWithCapacity:count];
  for (CFIndex i = 0; i < count; i++) {
    ABRecordRef personRef = CFArrayGetValueAtIndex(arrayRef, i);
    int id_ = ABRecordGetRecordID(personRef);
    TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:module] autorelease];
    [members addObject:person];
  }
  CFRelease(arrayRef);

  return members;
}

- (NSArray *)sortedMembers:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber)
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(^{
      result = [[self sortedMembers:value] retain];
    },
        YES);
    return [result autorelease];
  }

  if ([TiUtils isIOS9OrGreater]) {
    CNContactStore *ourContactStore = [module contactStore];
    if (ourContactStore == NULL) {
      return nil;
    }
    CNContactSortOrder sortOrder;
    int sortType = [value intValue];
    switch (sortType) {
    case kABPersonSortByFirstName:
      sortOrder = CNContactSortOrderGivenName;
      break;
    case kABPersonSortByLastName:
      sortOrder = CNContactSortOrderFamilyName;
      break;
    default:
      [self throwException:[NSString stringWithFormat:@"Invalid sort value: %d", sortType]
                 subreason:nil
                  location:CODELOCATION];
      return nil;
    }
    NSError *error = nil;
    NSMutableArray *peopleRefs = nil;
    peopleRefs = [[NSMutableArray alloc] init];
    CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:[ContactsModule contactKeysWithImage]];
    fetchRequest.predicate = [CNContact predicateForContactsInGroupWithIdentifier:[group identifier]];
    fetchRequest.sortOrder = sortOrder;
    fetchRequest.mutableObjects = YES;
    BOOL success = [ourContactStore enumerateContactsWithFetchRequest:fetchRequest
                                                                error:&error
                                                           usingBlock:^(CNContact *__nonnull contact, BOOL *__nonnull stop) {
                                                             // Observer is module because we want all changes to be propagated and the respective CNSaveRequest is updated.
                                                             TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext]
                                                                                                                              contactId:(CNMutableContact *)contact
                                                                                                                                 module:module
                                                                                                                               observer:module] autorelease];
                                                             [peopleRefs addObject:person];
                                                           }];
    RELEASE_TO_NIL(fetchRequest)
    if (success) {
      NSArray *people = [NSArray arrayWithArray:peopleRefs];
      RELEASE_TO_NIL(peopleRefs)
      return people;
    } else {
      DebugLog(@"%@", [TiUtils messageFromError:error]);
      RELEASE_TO_NIL(peopleRefs)
      return nil;
    }
  }

  int sortType = [value intValue];
  switch (sortType) {
  case kABPersonSortByFirstName:
  case kABPersonSortByLastName:
    break;
  default:
    [self throwException:[NSString stringWithFormat:@"Invalid sort value: %d", sortType]
               subreason:nil
                location:CODELOCATION];
    return nil;
  }
  CFArrayRef arrayRef = ABGroupCopyArrayOfAllMembersWithSortOrdering([self record], sortType);
  if (arrayRef == NULL) {
    return nil;
  }
  CFIndex count = CFArrayGetCount(arrayRef);
  NSMutableArray *members = [NSMutableArray arrayWithCapacity:count];
  for (CFIndex i = 0; i < count; i++) {
    ABRecordRef personRef = CFArrayGetValueAtIndex(arrayRef, i);
    int id_ = ABRecordGetRecordID(personRef);
    TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:module] autorelease];
    [members addObject:person];
  }
  CFRelease(arrayRef);

  return members;
}

- (void)add:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiContactsPerson)
  ENSURE_UI_THREAD(add, arg);
  if ([TiUtils isIOS9OrGreater]) {
    TiContactsPerson *person = arg;
    CNContactStore *ourContactStore = [module contactStore];
    if (ourContactStore == NULL) {
      return;
    }
    NSError *error;
    CNSaveRequest *saveRequest = [person getSaveRequestForAddToGroup:group];
    if (saveRequest == nil) {
      DebugLog(@"[ERROR] Unable to add");
      return;
    }
    if (![ourContactStore executeSaveRequest:saveRequest error:&error]) {
      [self throwException:[NSString stringWithFormat:@"Unable to add member to group: %@", [TiUtils messageFromError:error]]
                 subreason:nil
                  location:CODELOCATION];
    };
// Ignore static analylzer warning here
// This is to release the saverequest in TiContactsPerson.m line 965 in (CNSaveRequest*)getSaveRequestForAddition
#ifndef __clang_analyzer__
    RELEASE_TO_NIL(saveRequest)
#endif
    return;
  }

  CFErrorRef error;
  if (!ABGroupAddMember([self record], [arg record], &error)) {
    CFStringRef errorStr = CFErrorCopyDescription(error);
    NSString *str = [NSString stringWithString:(NSString *)errorStr];
    CFRelease(errorStr);

    [self throwException:[NSString stringWithFormat:@"Failed to add person %@ to group %@: %@", [arg fullName], [self name], str]
               subreason:nil
                location:CODELOCATION];
  }
}

- (void)remove:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiContactsPerson)
  ENSURE_UI_THREAD(remove, arg);

  if ([TiUtils isIOS9OrGreater]) {
    TiContactsPerson *person = arg;
    CNContactStore *ourContactStore = [module contactStore];
    if (ourContactStore == NULL) {
      return;
    }
    NSError *error;
    CNSaveRequest *saveRequest = [person getSaveRequestForRemoveFromGroup:group];
    if (saveRequest == nil) {
      DebugLog(@"[ERROR] Unable to add");
      return;
    }
    if (![ourContactStore executeSaveRequest:saveRequest error:&error]) {
      [self throwException:[NSString stringWithFormat:@"Unable to add member to group: %@", [TiUtils messageFromError:error]]
                 subreason:nil
                  location:CODELOCATION];
    };
// Ignore static analyzer warning here
// This is to release the saverequest in TiContactsPerson.m line 956 in (CNSaveRequest*)getSaveRequestForDeletion
#ifndef __clang_analyzer__
    RELEASE_TO_NIL(saveRequest)
#endif
    return;
  }

  CFErrorRef error;
  if (!ABGroupRemoveMember([self record], [arg record], &error)) {
    CFStringRef errorStr = CFErrorCopyDescription(error);
    NSString *str = [NSString stringWithString:(NSString *)errorStr];
    CFRelease(errorStr);

    [self throwException:[NSString stringWithFormat:@"Failed to remove person %@ to group %@: %@", [arg fullName], [self name], str]
               subreason:nil
                location:CODELOCATION];
  }
}

//For iOS9 deleting contact
#ifndef __clang_analyzer__
- (CNSaveRequest *)getSaveRequestForDeletion
{
  CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
  [saveRequest deleteGroup:[[group mutableCopy] autorelease]];
  // Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/commit/a0d4a50d51f1afe85f92cf9e0d2ce8cca08fcf2f
  // It will be released in ContactsModule.m line 315 in (void)save
  return saveRequest;
}

- (CNSaveRequest *)getSaveRequestForAddition:(NSString *)containerIdentifier
{
  CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
  [saveRequest addGroup:group toContainerWithIdentifier:containerIdentifier];
  // Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/commit/a0d4a50d51f1afe85f92cf9e0d2ce8cca08fcf2f
  // It will be released in ContactsModule.m line 315 in (void)save
  return saveRequest;
}
#endif
@end
#endif
