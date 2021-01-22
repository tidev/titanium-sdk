/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS

#import "ContactsModule.h"
#import "TiContactsGroup.h"
#import "TiContactsPerson.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBase.h>

#define appleUndocumentedBirthdayProperty 999
#define appleUndocumentedToneProperty 16
#define appleUndocumentedRingToneIdentifier -1
#define appleUndocumentedRingVibrationIdentifier -101
#define appleUndocumentedTextToneIdentifier -2
#define appleUndocumentedTextVibrationIdentifier -102

static NSArray *contactKeysWithImage;
static NSArray *contactKeysWithoutImage;

@implementation ContactsModule

- (void)contactStoreDidChange:(NSNotification *)notification
{
  if ([self _hasListeners:@"reload"]) {
    [self fireEvent:@"reload" withObject:nil];
  }
}

- (CNContactStore *)contactStore
{
  if (![NSThread isMainThread]) {
    return NULL;
  }

  if (needsContactStoreFetch && (contactStore != nil)) {
    RELEASE_TO_NIL(contactStore);
    contactStore = nil;
  }
  needsContactStoreFetch = NO;

  if (contactStore == NULL) {
    contactStore = [[CNContactStore alloc] init];
    if (contactStore == NULL) {
      DebugLog(@"[WARN] Could not create an address book. Make sure you have gotten permission first.");
    } else {
      NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
      [nc addObserver:self selector:@selector(contactStoreDidChange:) name:CNContactStoreDidChangeNotification object:nil];
    }
  }
  return contactStore;
}

- (void)startup
{
  [super startup];
  contactStore = NULL;
  _includeNote = YES;
}

//used for fetch predicates.
+ (NSArray *)contactKeysWithImage
{
  if (contactKeysWithImage == nil) {
    contactKeysWithImage = [[NSArray alloc] initWithObjects:CNContactNamePrefixKey, CNContactGivenNameKey, CNContactMiddleNameKey, CNContactFamilyNameKey, CNContactPreviousFamilyNameKey, CNContactNameSuffixKey, CNContactNicknameKey, CNContactPhoneticGivenNameKey, CNContactPhoneticGivenNameKey, CNContactPhoneticMiddleNameKey, CNContactPhoneticFamilyNameKey, CNContactOrganizationNameKey, CNContactDepartmentNameKey, CNContactJobTitleKey, CNContactBirthdayKey, CNContactNonGregorianBirthdayKey, CNContactNoteKey, CNContactTypeKey, CNContactPhoneNumbersKey, CNContactEmailAddressesKey, CNContactPostalAddressesKey, CNContactDatesKey, CNContactUrlAddressesKey, CNContactRelationsKey, CNContactSocialProfilesKey, CNContactInstantMessageAddressesKey, CNContactImageDataKey, CNContactImageDataAvailableKey, CNContactThumbnailImageDataKey, nil];
  }
  return contactKeysWithImage;
}

//reserved for future use
+ (NSArray *)contactKeysWithoutImage
{
  if (contactKeysWithoutImage == nil) {
    contactKeysWithoutImage = [[NSArray alloc] initWithObjects:CNContactNamePrefixKey, CNContactGivenNameKey, CNContactMiddleNameKey, CNContactFamilyNameKey, CNContactPreviousFamilyNameKey, CNContactNameSuffixKey, CNContactNicknameKey, CNContactPhoneticGivenNameKey, CNContactPhoneticGivenNameKey, CNContactPhoneticMiddleNameKey, CNContactPhoneticFamilyNameKey, CNContactOrganizationNameKey, CNContactDepartmentNameKey, CNContactJobTitleKey, CNContactBirthdayKey, CNContactNonGregorianBirthdayKey, CNContactNoteKey, CNContactTypeKey, CNContactPhoneNumbersKey, CNContactEmailAddressesKey, CNContactPostalAddressesKey, CNContactDatesKey, CNContactUrlAddressesKey, CNContactRelationsKey, CNContactSocialProfilesKey, CNContactInstantMessageAddressesKey, nil];
  }
  return contactKeysWithoutImage;
}

- (void)dealloc
{
  RELEASE_TO_NIL(cancelCallback)
  RELEASE_TO_NIL(selectedPersonCallback)
  RELEASE_TO_NIL(selectedPropertyCallback)
  RELEASE_TO_NIL(contactKeysWithoutImage)
  RELEASE_TO_NIL(contactKeysWithImage)
  RELEASE_TO_NIL(contactStore)
  saveRequest = nil;
  RELEASE_TO_NIL(contactPicker)
      [[NSNotificationCenter defaultCenter] removeObserver:self
                                                      name:CNContactStoreDidChangeNotification
                                                    object:nil];
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.Contacts";
}

#pragma mark Public API

- (void)setIncludeNote:(id)arg
{
  _includeNote = [TiUtils boolValue:arg def:YES];
}

- (NSNumber *)hasContactsPermissions:(id)unused
{
  NSString *calendarPermission = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSContactsUsageDescription"];

  if (!calendarPermission) {
    NSLog(@"[ERROR] iOS 10 and later requires the key \"NSContactsUsageDescription\" inside the plist in your tiapp.xml when accessing the native contacts. Please add the key and re-run the application.");
  }

  return @([CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts] == CNAuthorizationStatusAuthorized);
}

- (void)requestContactsPermissions:(id)args
{
  ENSURE_SINGLE_ARG(args, KrollCallback);
  KrollCallback *callback = args;
  NSString *error = nil;
  int code = 0;
  BOOL doPrompt = NO;

  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
  case CNAuthorizationStatusNotDetermined:
    doPrompt = YES;
    break;
  case CNAuthorizationStatusAuthorized:
    break;
  case CNAuthorizationStatusDenied:
    code = CNAuthorizationStatusDenied;
    error = NSLocalizedString(@"The user has denied access to the address book", nil);
    break;
  case CNAuthorizationStatusRestricted:
    code = CNAuthorizationStatusRestricted;
    error = NSLocalizedString(@"The user is unable to allow access to the address book", nil);
    break;
  default:
    break;
  }
  if (!doPrompt) {
    NSDictionary *propertiesDict = [TiUtils dictionaryWithCode:code message:error];
    NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

    [callback call:invocationArray thisObject:self];
    [invocationArray release];
    return;
  }
  TiThreadPerformOnMainThread(
      ^() {
        CNContactStore *ourContactStore = [self contactStore];
        [ourContactStore requestAccessForEntityType:CNEntityTypeContacts
                                  completionHandler:^(BOOL granted, NSError *error) {
                                    NSString *errorMessage = granted ? nil : @"The user has denied access to the address book";
                                    NSDictionary *propertiesDict = [TiUtils dictionaryWithCode:[error code] message:errorMessage];
                                    KrollEvent *invocationEvent = [[KrollEvent alloc] initWithCallback:callback eventObject:propertiesDict thisObject:self];
                                    [[callback context] enqueue:invocationEvent];
                                    RELEASE_TO_NIL(invocationEvent);
                                  }];
      },
      NO);
}

- (NSNumber *)contactsAuthorization
{
  CNAuthorizationStatus result = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  return @(result);
}

- (void)save:(id)unused
{
  ENSURE_UI_THREAD(save, unused)

  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return;
  }
  NSError *error = nil;
  if (saveRequest == nil) {
    DebugLog(@"Nothing to save");
    return;
  }
  if (![ourContactStore executeSaveRequest:saveRequest error:&error]) {
    [self throwException:[NSString stringWithFormat:@"Unable to save contact store: %@", [TiUtils messageFromError:error]]
               subreason:nil
                location:CODELOCATION];
  };
  RELEASE_TO_NIL(saveRequest);
}

- (void)revert:(id)unused
{
  ENSURE_UI_THREAD(revert, unused)
  DEPRECATED_REMOVED(@"Contacts.revert()", @"8.0.0", @"8.0.0. Re-fetch your contacts instead.");
}

- (void)showContacts:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary)
  ENSURE_UI_THREAD(showContacts, args);

  RELEASE_TO_NIL(cancelCallback)
  RELEASE_TO_NIL(selectedPersonCallback)
  RELEASE_TO_NIL(selectedPropertyCallback)
  RELEASE_TO_NIL(contactPicker)
  cancelCallback = [[args objectForKey:@"cancel"] retain];
  selectedPersonCallback = [[args objectForKey:@"selectedPerson"] retain];
  selectedPropertyCallback = [[args objectForKey:@"selectedProperty"] retain];

  contactPicker = [[CNContactPickerViewController alloc] init];
  [contactPicker setDelegate:self];
  if (selectedPropertyCallback == nil) {
    contactPicker.predicateForSelectionOfProperty = [NSPredicate predicateWithValue:NO];
  }

  if (selectedPersonCallback == nil) {
    contactPicker.predicateForSelectionOfContact = [NSPredicate predicateWithValue:NO];
  }
  animated = [TiUtils boolValue:@"animated" properties:args def:YES];

  NSArray *fields = [args objectForKey:@"fields"];
  ENSURE_TYPE_OR_NIL(fields, NSArray)

  if (fields != nil) {
    NSMutableArray *pickerFields = [NSMutableArray arrayWithCapacity:[fields count]];
    for (id field in fields) {
      id property = nil;
      if (property = [[[TiContactsPerson iOS9propertyKeys] allKeysForObject:field] objectAtIndex:0]) {
        [pickerFields addObject:property];
      }
    }
    [contactPicker setDisplayedPropertyKeys:pickerFields];
  }

  [[TiApp app] showModalController:contactPicker animated:animated];
}

- (TiContactsPerson *)getPersonByIdentifier:(id)arg
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getPersonByIdentifier:arg] retain];
        },
        YES);
    return [result autorelease];
  }
  ENSURE_SINGLE_ARG(arg, NSString)
  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return nil;
  }
  NSError *error = nil;
  CNContact *contact = nil;
  NSMutableArray *contactKeys = [NSMutableArray arrayWithArray:[ContactsModule contactKeysWithImage]];
  if (!_includeNote) {
    [contactKeys removeObject:CNContactNoteKey];
  }
  contact = [ourContactStore unifiedContactWithIdentifier:arg keysToFetch:contactKeys error:&error];
  if (error) {
    return nil;
  }
  return [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext]
                                               contactId:(CNMutableContact *)contact
                                                  module:self
                                                observer:self] autorelease];
}

- (TiContactsGroup *)getGroupByIdentifier:(id)arg
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getGroupByIdentifier:arg] retain];
        },
        YES);
    return [result autorelease];
  }
  ENSURE_SINGLE_ARG(arg, NSString)
  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return nil;
  }
  NSError *error = nil;
  NSArray *groups = nil;
  groups = [ourContactStore groupsMatchingPredicate:[CNGroup predicateForGroupsWithIdentifiers:@[ arg ]] error:&error];
  if (!groups) {
    return nil;
  }
  if ([groups count] == 0) {
    return nil;
  }
  return [[[TiContactsGroup alloc] _initWithPageContext:[self executionContext] contactGroup:[groups objectAtIndex:0] module:self] autorelease];
}

- (NSArray *)getPeopleWithName:(id)arg
{
  ENSURE_SINGLE_ARG(arg, NSString)

  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getPeopleWithName:arg] retain];
        },
        YES);
    return [result autorelease];
  }

  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return nil;
  }
  NSError *error = nil;
  NSArray *contacts = nil;
  NSMutableArray *contactKeys = [NSMutableArray arrayWithArray:[ContactsModule contactKeysWithImage]];
  if (!_includeNote) {
    [contactKeys removeObject:CNContactNoteKey];
  }
  //returns empty array or nil if there's an error
  contacts = [ourContactStore unifiedContactsMatchingPredicate:[CNContact predicateForContactsMatchingName:arg] keysToFetch:contactKeys error:&error];
  if (!contacts) {
    return nil;
  }
  if ([contacts count] == 0) {
    return @[];
  }
  NSMutableArray *people = [NSMutableArray arrayWithCapacity:[contacts count]];
  for (CNContact *personRef in contacts) {
    TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext]
                                                                     contactId:(CNMutableContact *)personRef
                                                                        module:self
                                                                      observer:self] autorelease];
    [people addObject:person];
  }
  return people;
}

- (NSArray *)getAllPeople:(id)unused
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getAllPeople:unused] retain];
        },
        YES);
    return [result autorelease];
  }

  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return nil;
  }
  NSError *error = nil;
  NSMutableArray *peopleRefs = nil;
  peopleRefs = [[NSMutableArray alloc] init];
  NSMutableArray *array = [NSMutableArray arrayWithArray:[ContactsModule contactKeysWithImage]];
  if (!_includeNote) {
    [array removeObject:CNContactNoteKey];
  }
  CNContactFetchRequest *fetchRequest = [[CNContactFetchRequest alloc] initWithKeysToFetch:array];
  BOOL success = [ourContactStore enumerateContactsWithFetchRequest:fetchRequest
                                                              error:&error
                                                         usingBlock:^(CNContact *__nonnull contact, BOOL *__nonnull stop) {
                                                           TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] contactId:(CNMutableContact *)contact module:self observer:self] autorelease];
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

- (NSArray *)getAllGroups:(id)unused
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self getAllGroups:unused] retain];
        },
        YES);
    return [result autorelease];
  }

  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    return nil;
  }
  NSError *error = nil;
  NSArray *groupRefs = nil;
  groupRefs = [ourContactStore groupsMatchingPredicate:nil error:&error];
  if (groupRefs == nil) {
    return nil;
  }
  NSMutableArray *groups = [NSMutableArray arrayWithCapacity:[groupRefs count]];
  for (CNMutableGroup *thisGroup in groupRefs) {
    TiContactsGroup *group = [[[TiContactsGroup alloc] _initWithPageContext:[self executionContext] contactGroup:thisGroup module:self] autorelease];
    [groups addObject:group];
  }
  return groups;
}

- (TiContactsPerson *)createPerson:(id)arg
{
  ENSURE_SINGLE_ARG_OR_NIL(arg, NSDictionary)

  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self createPerson:arg] retain];
        },
        YES);
    return [result autorelease];
  }

  CNContactStore *ourContactStore = [self contactStore];
  if (ourContactStore == NULL) {
    [self throwException:@"Cannot access address book"
               subreason:nil
                location:CODELOCATION];
    return nil;
  }
  if (saveRequest != nil) {
    [self throwException:@"Cannot create a new entry with unsaved changes"
               subreason:nil
                location:CODELOCATION];
    return nil;
  }
  NSError *error = nil;
  CNMutableContact *newContact = [[CNMutableContact alloc] init];
  // We dont set observer here because we dont want to be notified when props are being added to a newly created contact.
  TiContactsPerson *newPerson = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext]
                                                                      contactId:newContact
                                                                         module:self] autorelease];
  RELEASE_TO_NIL(newContact);
  [newPerson setValuesForKeysWithDictionary:arg];
  [newPerson updateiOS9ContactProperties];
  saveRequest = [newPerson getSaveRequestForAddition:[ourContactStore defaultContainerIdentifier]];
  [self save:nil];
  newPerson.observer = self;
  return newPerson;
}

- (void)removePerson:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiContactsPerson)
  ENSURE_UI_THREAD(removePerson, arg)

  TiContactsPerson *person = arg;
  saveRequest = nil;
  saveRequest = [person getSaveRequestForDeletion];

  return;
}

- (TiContactsGroup *)createGroup:(id)arg
{
  ENSURE_SINGLE_ARG_OR_NIL(arg, NSDictionary)

  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self createGroup:arg] retain];
        },
        YES);
    return [result autorelease];
  }

  CNContactStore *ourContactStore = [self contactStore];

  if (ourContactStore == NULL) {
    [self throwException:@"Cannot access address book"
               subreason:nil
                location:CODELOCATION];
    return nil;
  }
  if (saveRequest != nil) {
    [self throwException:@"Cannot create a new entry with unsaved changes"
               subreason:nil
                location:CODELOCATION];
    return nil;
  }
  NSError *error = nil;
  CNMutableGroup *tempGroup = [[CNMutableGroup alloc] init];
  TiContactsGroup *newGroup = [[[TiContactsGroup alloc] _initWithPageContext:[self executionContext] contactGroup:tempGroup module:self] autorelease];
  RELEASE_TO_NIL(tempGroup);
  [newGroup setValuesForKeysWithDictionary:arg];
  saveRequest = [newGroup getSaveRequestForAddition:[ourContactStore defaultContainerIdentifier]];

  return newGroup;
}

- (void)removeGroup:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiContactsGroup)
  ENSURE_UI_THREAD(removeGroup, arg)

  TiContactsGroup *group = arg;
  saveRequest = nil;
  saveRequest = [group getSaveRequestForDeletion];
}

#pragma mark Properties

MAKE_SYSTEM_PROP(CONTACTS_KIND_PERSON, CNContactTypePerson);
MAKE_SYSTEM_PROP(CONTACTS_KIND_ORGANIZATION, CNContactTypeOrganization);

MAKE_SYSTEM_PROP(CONTACTS_SORT_FIRST_NAME, CNContactSortOrderGivenName);
MAKE_SYSTEM_PROP(CONTACTS_SORT_LAST_NAME, CNContactSortOrderFamilyName);

MAKE_SYSTEM_PROP(AUTHORIZATION_UNKNOWN, CNAuthorizationStatusNotDetermined);
MAKE_SYSTEM_PROP_DEPRECATED_REMOVED(AUTHORIZATION_RESTRICTED, 1, @"AUTHORIZATION_RESTRICTED", @"8.0.0", @"8.0.0");
MAKE_SYSTEM_PROP(AUTHORIZATION_DENIED, CNAuthorizationStatusDenied);
MAKE_SYSTEM_PROP(AUTHORIZATION_AUTHORIZED, CNAuthorizationStatusAuthorized);

#pragma mark CNContactPickerDelegate

- (void)contactPicker:(nonnull CNContactPickerViewController *)picker didSelectContact:(nonnull CNContact *)contact
{
  if (selectedPersonCallback) {
    TiContactsPerson *person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] contactId:(CNMutableContact *)contact module:self observer:self] autorelease];
    [self _fireEventToListener:@"selectedPerson"
                    withObject:[NSDictionary dictionaryWithObject:person forKey:@"person"]
                      listener:selectedPersonCallback
                    thisObject:nil];
    [[TiApp app] hideModalController:contactPicker animated:animated];
  }
}

- (void)contactPicker:(nonnull CNContactPickerViewController *)picker didSelectContactProperty:(nonnull CNContactProperty *)contactProperty
{
  if (selectedPropertyCallback) {
    TiContactsPerson *personObject = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] contactId:(CNMutableContact *)contactProperty.contact module:self observer:self] autorelease];

    id value = contactProperty.value;
    id result = [NSNull null];
    NSString *property = [[TiContactsPerson iOS9propertyKeys] objectForKey:contactProperty.key];
    NSString *label = [[TiContactsPerson iOS9multiValueLabels] valueForKey:contactProperty.label];

    if ([value isKindOfClass:[NSString class]]) {
      result = value;
    }
    if ([value isKindOfClass:[NSDateComponents class]]) {
      //this part of the code is supposed to work for birthday and alternateBirthday
      //but iOS9 Beta is giving a null value for these properties in `value`, so only
      //processing `anniversary` and `other` here.
      //			if ([contactProperty.key isEqualToString:CNContactNonGregorianBirthdayKey]) {
      //				NSDateComponents *dateComps = (NSDateComponents*)value;
      //				result = [NSDictionary dictionaryWithObjectsAndKeys: dateComps.calendar.calendarIdentifier,@"calendarIdentifier",NUMLONG(dateComps.era),@"era",NUMLONG(dateComps.year),@"year",NUMLONG(dateComps.month),@"month",NUMLONG(dateComps.day),@"day",NUMBOOL(dateComps.isLeapMonth),@"isLeapMonth", nil];
      //			}
      //			else {
      NSDate *date = [[NSCalendar currentCalendar] dateFromComponents:value];
      result = [TiUtils UTCDateForDate:date];
      //			}
    }
    if ([value isKindOfClass:[CNPostalAddress class]]) {
      CNPostalAddress *address = value;
      NSDictionary *addressDict = [NSDictionary dictionaryWithObjectsAndKeys:address.street, @"Street",
                                                address.city, @"City",
                                                address.state, @"State",
                                                address.postalCode, @"PostalCode",
                                                address.country, @"Country",
                                                address.ISOCountryCode, @"CountryCode", nil];
      result = addressDict;
    }
    if ([value isKindOfClass:[CNSocialProfile class]]) {
      CNSocialProfile *profile = value;
      NSDictionary *profileDict = [NSDictionary dictionaryWithObjectsAndKeys:profile.service, @"service",
                                                profile.urlString, @"url",
                                                profile.userIdentifier, @"userIdentifier",
                                                profile.username, @"username", nil];
      result = profileDict;
    }
    if ([value isKindOfClass:[CNContactRelation class]]) {
      CNContactRelation *relation = value;
      result = relation.name;
    }
    if ([value isKindOfClass:[CNInstantMessageAddress class]]) {
      CNInstantMessageAddress *im = value;
      NSDictionary *imDict = [NSDictionary dictionaryWithObjectsAndKeys:im.service, @"service",
                                           im.username, @"username", nil];
      result = imDict;
    }
    if ([value isKindOfClass:[CNPhoneNumber class]]) {
      CNPhoneNumber *phoneNumber = value;
      result = phoneNumber.stringValue;
    }

    // iOS 9+ doesn't valuate birthdays. Watch this in case of changes.
    // Also contactProperty.identifier has an undocumented string "_systemCalendar" for gregorian calender.
    if ([contactProperty.key isEqualToString:@"birthdays"]) {
      if ([contactProperty.identifier isEqualToString:@"gregorian"] ||
          [contactProperty.identifier containsString:@"systemCalendar"]) {
        property = @"birthday";
        result = [personObject valueForUndefinedKey:property];
      } else {
        property = @"alternateBirthday";
        result = [personObject valueForUndefinedKey:property];
      }
    }

    NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:personObject, @"person", property, @"property", result, @"value", label, @"label", nil];
    [self _fireEventToListener:@"selectedProperty" withObject:dict listener:selectedPropertyCallback thisObject:nil];
    [[TiApp app] hideModalController:contactPicker animated:animated];
    return NO;
  }
  return YES;
}

- (void)contactPickerDidCancel:(nonnull CNContactPickerViewController *)picker
{
  [[TiApp app] hideModalController:contactPicker animated:animated];
  if (cancelCallback) {
    [self _fireEventToListener:@"cancel" withObject:nil listener:cancelCallback thisObject:nil];
  }
}

- (void)contactViewController:(nonnull CNContactViewController *)viewController didCompleteWithContact:(nullable CNContact *)contact
{
  // Unused for nwo
}

#pragma mark - Ti.Contacts.PersonUpdateObserver

- (void)didUpdatePerson:(TiContactsPerson *)person
{
  saveRequest = saveRequest ? saveRequest : [CNSaveRequest new];
  [saveRequest updateContact:person.nativePerson];
}

@end

#endif
