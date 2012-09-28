/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS

#import <AddressBookUI/AddressBookUI.h>
#import "ContactsModule.h"
#import "TiContactsPerson.h"
#import "TiContactsGroup.h"
#import "TiApp.h"
#import "TiBase.h"

#pragma Backwards compatibility for pre-iOS 6.0

#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_6_0
#define kABAuthorizationStatusNotDetermined 0
#define kABAuthorizationStatusRestricted 1
#define kABAuthorizationStatusDenied 2
#define kABAuthorizationStatusAuthorized 3

extern signed long ABAddressBookGetAuthorizationStatus(void);
extern ABAddressBookRef ABAddressBookCreateWithOptions(CFDictionaryRef options, CFErrorRef* error);

typedef void(^ABAddressBookRequestAccessCompletionHandler)(bool granted, CFErrorRef error);
extern void ABAddressBookRequestAccessWithCompletion(ABAddressBookRef addressBook,  ABAddressBookRequestAccessCompletionHandler completion);

#endif

@implementation ContactsModule

// We'll force the address book to only be accessed on the main thread, for consistency.  Otherwise
// we could run into cross-thread memory issues.
-(ABAddressBookRef)addressBook
{
	if (![NSThread isMainThread]) {
		return NULL;
	}
	
	if (addressBook == NULL) {
		if (iOS6API) {
			addressBook = ABAddressBookCreateWithOptions(NULL, NULL);
		} else {
			addressBook = ABAddressBookCreate();
		}
		if (addressBook == NULL) {
			DebugLog(@"[WARN] Could not create an address book. Make sure you have gotten permission first.");
		}
	}
	return addressBook;
}

-(void)releaseAddressBook
{
	TiThreadPerformOnMainThread(^{CFRelease(addressBook);}, YES);
}

-(void)startup
{
	[super startup];
	addressBook = NULL;
    if (ABAddressBookGetAuthorizationStatus != NULL) {
		iOS6API = YES;
	}
    // Force address book creation so that our properties are properly initialized - they aren't
    // defined until the address book is loaded, for some reason.
	TiThreadPerformOnMainThread(^{[self addressBook];}, YES);
}

-(void)dealloc
{
	RELEASE_TO_NIL(picker)
	RELEASE_TO_NIL(cancelCallback)
	RELEASE_TO_NIL(selectedPersonCallback)
	RELEASE_TO_NIL(selectedPropertyCallback)
	if (addressBook != NULL) {
		[self releaseAddressBook];
	}
	[super dealloc];
}

-(void)removeRecord:(ABRecordRef)record
{
	CFErrorRef error;
	if (!ABAddressBookRemoveRecord([self addressBook], record, &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		NSString* kind = (ABRecordGetRecordType(record) == kABPersonType) ? @"person" : @"group";
		
		[self throwException:[NSString stringWithFormat:@"Failed to remove %@: %@",kind,str]
				   subreason:nil
					location:CODELOCATION];
	}
}

#pragma mark Public API

-(void) requestAuthorization:(id)args
{
	ENSURE_SINGLE_ARG(args, KrollCallback);
	KrollCallback * callback = args;
	bool success = NO;
	NSString * error = nil;
	NSNumber * code = nil;
	bool doPrompt = NO;
	
	if(!iOS6API){
		success = YES;
	} else {
		long int permissions = ABAddressBookGetAuthorizationStatus();
		switch (permissions) {
			case kABAuthorizationStatusNotDetermined:
				doPrompt = YES;
				break;
			case kABAuthorizationStatusAuthorized:
				success = YES;
				break;
			case kABAuthorizationStatusDenied:
				code = [NSNumber numberWithInt:kABAuthorizationStatusDenied];
				error = @"The user has denied access to the address book";
			case kABAuthorizationStatusRestricted:
				code = [NSNumber numberWithInt:kABAuthorizationStatusRestricted];
				error = @"The user is unable to allow access to the address book";
			default:
				break;
		}
	}
	if (!doPrompt) {
		NSDictionary * propertiesDict = [[NSDictionary alloc] initWithObjectsAndKeys:
										 [NSNumber numberWithBool:success],@"success",
										 code,@"code", error,@"error", nil];
		NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

		[callback call:invocationArray thisObject:self];
		[invocationArray release];
		[propertiesDict release];
		return;
	}

	TiThreadPerformOnMainThread(^(){
		ABAddressBookRef ourAddressBook = [self addressBook];
		ABAddressBookRequestAccessWithCompletion(ourAddressBook, ^(bool granted, CFErrorRef error) {
			NSString * errorString = nil;
			NSNumber * code = nil;
			if (error != NULL){
				code = [NSNumber numberWithInt:CFErrorGetCode(error)];
				errorString = [(NSString *)CFErrorCopyDescription(error) autorelease];
			}
			NSDictionary * propertiesDict = [[NSDictionary alloc] initWithObjectsAndKeys:
											 [NSNumber numberWithBool:granted],@"success",
											 code,@"code", error,@"error", nil];
			
			KrollEvent * invocationEvent = [[KrollEvent alloc] initWithCallback:callback eventObject:propertiesDict thisObject:self];
			[[callback context] enqueue:invocationEvent];
			[propertiesDict release];
		});
	}, NO);
}



-(NSNumber*) contactsAuthorization
{
	if (!iOS6API) { //5.1 and before: We always had permission.
		return [self AUTHORIZATION_AUTHORIZED];
	}
	long int result = ABAddressBookGetAuthorizationStatus();
	return [NSNumber numberWithLong:result];
}

-(void)save:(id)unused
{
	ENSURE_UI_THREAD(save, unused)
	// ABAddressBookHasUnsavedChanges is broken in pre-3.2
	//if (ABAddressBookHasUnsavedChanges([self addressBook])) {
	CFErrorRef error;
	if (!ABAddressBookSave([self addressBook], &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Unable to save address book: %@",str]
				   subreason:nil
					location:CODELOCATION];
	}
	//}
}

-(void)revert:(id)unused
{
	ENSURE_UI_THREAD(revert, unused)
	// ABAddressBookHasUnsavedChanges is broken in pre-3.2
	//if (ABAddressBookHasUnsavedChanges([self addressBook])) {
	ABAddressBookRevert([self addressBook]);
	//}
}

-(void)showContacts:(id)args
{
	ENSURE_SINGLE_ARG(args, NSDictionary)
	ENSURE_UI_THREAD(showContacts, args);
	
	RELEASE_TO_NIL(cancelCallback)
	RELEASE_TO_NIL(selectedPersonCallback)
	RELEASE_TO_NIL(selectedPropertyCallback)
	RELEASE_TO_NIL(picker)
	
	cancelCallback = [[args objectForKey:@"cancel"] retain];
	selectedPersonCallback = [[args objectForKey:@"selectedPerson"] retain];
	selectedPropertyCallback = [[args objectForKey:@"selectedProperty"] retain];
	
	picker = [[ABPeoplePickerNavigationController alloc] init];
	[picker setPeoplePickerDelegate:self];
	
	animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	
	NSArray* fields = [args objectForKey:@"fields"];
	ENSURE_TYPE_OR_NIL(fields, NSArray)
	
	if (fields != nil) {
		NSMutableArray* pickerFields = [NSMutableArray arrayWithCapacity:[fields count]];
		for (id field in fields) {
			id property = nil;
			if ((property = [[TiContactsPerson contactProperties] objectForKey:field]) ||
				(property = [[TiContactsPerson multiValueProperties] objectForKey:field]))  {
				[pickerFields addObject:property];
			}
		}
		[picker setDisplayedProperties:pickerFields];
	}
	
	[[TiApp app] showModalController:picker animated:animated];
}

// OK to do outside main thread
-(TiContactsPerson*)getPersonByID:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSObject)
	__block int idNum = [TiUtils intValue:arg];
	__block BOOL validId = NO;	
	dispatch_sync(dispatch_get_main_queue(),^{
		if (addressBook == NULL) {
			return;
		}
		ABRecordRef record = NULL;
		record = ABAddressBookGetPersonWithRecordID(addressBook, idNum);
		if (record != NULL)
		{
			validId = YES;
		}
	});
	if (validId == YES)
	{
		return [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:idNum module:self] autorelease];
	}
	return NULL;
}

-(TiContactsGroup*)getGroupByID:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSObject)
	__block int idNum = [TiUtils intValue:arg];
	__block BOOL validId = NO;	
	dispatch_sync(dispatch_get_main_queue(),^{
		if (addressBook == NULL) {
			return;
		}
		ABRecordRef record = NULL;
		record = ABAddressBookGetGroupWithRecordID(addressBook, idNum);
		if (record != NULL) 
		{
			validId = YES;
		}
	});
	if (validId == YES)
	{	
		return [[[TiContactsGroup alloc] _initWithPageContext:[self executionContext] recordId:idNum module:self] autorelease];
	}
	return NULL;
	
}

-(NSArray*)getPeopleWithName:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSString)
	
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self getPeopleWithName:arg] retain];}, YES);
		return [result autorelease];
	}
	ABAddressBookRef ourAddressBook = [self addressBook];
	if (ourAddressBook == NULL) {
		return nil;
	}
	CFArrayRef peopleRefs = ABAddressBookCopyPeopleWithName(ourAddressBook, (CFStringRef)arg);
	if (peopleRefs == NULL) {
		return nil;
	}
	CFIndex count = CFArrayGetCount(peopleRefs);
	NSMutableArray* people = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef ref = CFArrayGetValueAtIndex(peopleRefs, i);
		ABRecordID id_ = ABRecordGetRecordID(ref);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[people addObject:person];
	}	
	CFRelease(peopleRefs);
	
	return people;
}

-(NSArray*)getAllPeople:(id)unused
{
	if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self getAllPeople:unused] retain];}, YES);
		return [result autorelease];
	}
	ABAddressBookRef ourAddressBook = [self addressBook];
	if (ourAddressBook == NULL) {
		return nil;
	}
	CFArrayRef peopleRefs = ABAddressBookCopyArrayOfAllPeople(ourAddressBook);
	if (peopleRefs == NULL) {
		return nil;
	}
	CFIndex count = CFArrayGetCount(peopleRefs);
	NSMutableArray* people = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef ref = CFArrayGetValueAtIndex(peopleRefs, i);
		ABRecordID id_ = ABRecordGetRecordID(ref);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[people addObject:person];
	}	
	CFRelease(peopleRefs);
	
	return people;
}

-(NSArray*)getAllGroups:(id)unused
{
	if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self getAllGroups:unused] retain];}, YES);
		return [result autorelease];
	}
	ABAddressBookRef ourAddressBook = [self addressBook];
	if (ourAddressBook == NULL) {
		return nil;
	}
	CFArrayRef groupRefs = ABAddressBookCopyArrayOfAllGroups(ourAddressBook);
	if (groupRefs == NULL) {
		return nil;
	}
	CFIndex count = CFArrayGetCount(groupRefs);
	NSMutableArray* groups = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef ref = CFArrayGetValueAtIndex(groupRefs, i);
		ABRecordID id_ = ABRecordGetRecordID(ref);
		TiContactsGroup* group = [[[TiContactsGroup	alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[groups addObject:group];
	}
	CFRelease(groupRefs);
	
	return groups;
}

-(TiContactsPerson*)createPerson:(id)arg
{
    ENSURE_SINGLE_ARG_OR_NIL(arg, NSDictionary)
    
	if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self createPerson:arg] retain];}, YES);
		return [result autorelease];
	}
	ABAddressBookRef ourAddressBook = [self addressBook];
	if (ourAddressBook == NULL) {
		[self throwException:@"Cannot access address book"
				   subreason:nil
					location:CODELOCATION];
	}
	if (ABAddressBookHasUnsavedChanges(ourAddressBook)) {
		[self throwException:@"Cannot create a new entry with unsaved changes"
				   subreason:nil
					location:CODELOCATION];
		return nil;
	}
	
	ABRecordRef record = ABPersonCreate();
	[(id)record autorelease];
	CFErrorRef error;
	if (!ABAddressBookAddRecord(ourAddressBook, record, &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to add person: %@",str]
				   subreason:nil
					location:CODELOCATION];
		return nil;
	}
	[self save:nil];
	
	ABRecordID id_ = ABRecordGetRecordID(record);
	TiContactsPerson* newPerson = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
	
    [newPerson setValuesForKeysWithDictionary:arg];
    
    if (arg != nil) {
        // Have to save initially so properties can be set; have to save again to commit changes
        [self save:nil];
    }
    
	return newPerson;
}

-(void)removePerson:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiContactsPerson)
	ENSURE_UI_THREAD(removePerson,arg)
	
	[self removeRecord:[arg record]];
}

-(TiContactsGroup*)createGroup:(id)arg
{
    ENSURE_SINGLE_ARG_OR_NIL(arg, NSDictionary)
    
	if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self createGroup:arg] retain];}, YES);
		return [result autorelease];
	}
	
	ABAddressBookRef ourAddressBook = [self addressBook];
	if (ourAddressBook == NULL) {
		[self throwException:@"Cannot access address book"
				   subreason:nil
					location:CODELOCATION];
	}
	if (ABAddressBookHasUnsavedChanges(ourAddressBook)) {
		[self throwException:@"Cannot create a new entry with unsaved changes"
				   subreason:nil
					location:CODELOCATION];
	}
	
	ABRecordRef record = ABGroupCreate();
	[(id)record autorelease];
	CFErrorRef error;
	if (!ABAddressBookAddRecord(ourAddressBook, record, &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to add group: %@",str]
				   subreason:nil
					location:CODELOCATION];
	}
	[self save:nil];
	
	ABRecordID id_ = ABRecordGetRecordID(record);
	TiContactsGroup* newGroup = [[[TiContactsGroup alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
	
    [newGroup setValuesForKeysWithDictionary:arg];
    
    if (arg != nil) {
        // Have to save initially so properties can be set; have to save again to commit changes
        [self save:nil];
    }
    
	return newGroup;
}

-(void)removeGroup:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiContactsGroup)
	ENSURE_UI_THREAD(removePerson,arg)
	
	[self removeRecord:[arg record]];
}

#pragma mark Properties

MAKE_SYSTEM_NUMBER(CONTACTS_KIND_PERSON,[[(NSNumber*)kABPersonKindPerson retain] autorelease])
MAKE_SYSTEM_NUMBER(CONTACTS_KIND_ORGANIZATION,[[(NSNumber*)kABPersonKindOrganization retain] autorelease])

MAKE_SYSTEM_PROP(CONTACTS_SORT_FIRST_NAME,kABPersonSortByFirstName);
MAKE_SYSTEM_PROP(CONTACTS_SORT_LAST_NAME,kABPersonSortByLastName);

MAKE_SYSTEM_PROP(AUTHORIZATION_UNKNOWN, kABAuthorizationStatusNotDetermined);
MAKE_SYSTEM_PROP(AUTHORIZATION_RESTRICTED, kABAuthorizationStatusRestricted);
MAKE_SYSTEM_PROP(AUTHORIZATION_DENIED, kABAuthorizationStatusDenied);
MAKE_SYSTEM_PROP(AUTHORIZATION_AUTHORIZED, kABAuthorizationStatusAuthorized);

#pragma mark Picker delegate functions

-(void)peoplePickerNavigationControllerDidCancel:(ABPeoplePickerNavigationController *)peoplePicker
{
	[[TiApp app] hideModalController:picker animated:animated];
	if (cancelCallback) {
		[self _fireEventToListener:@"cancel" withObject:nil listener:cancelCallback thisObject:nil];
	}
}

-(BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person
{
	if (selectedPersonCallback) {
		ABRecordID id_ = ABRecordGetRecordID(person);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[self _fireEventToListener:@"selectedPerson"
						withObject:[NSDictionary dictionaryWithObject:person forKey:@"person"] 
						listener:selectedPersonCallback 
						thisObject:nil];
		[[TiApp app] hideModalController:picker animated:animated];
		return NO;
	}
	return YES;
}

-(BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifier
{
	if (selectedPropertyCallback) {
		ABRecordID id_ = ABRecordGetRecordID(person);
		TiContactsPerson* personObject = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		NSString* propertyName = nil;
		id value = [NSNull null];
		id label = [NSNull null];
		if (identifier == kABMultiValueInvalidIdentifier) { 
			propertyName = [[[TiContactsPerson contactProperties] allKeysForObject:[NSNumber numberWithInt:property]] objectAtIndex:0];
            
            // Contacts is poorly-designed enough that we should worry about receiving NULL values for properties which are actually assigned.
			CFTypeRef val = ABRecordCopyValue(person, property);
            if (val != NULL) {
                value = [[(id)val retain] autorelease]; // Force toll-free bridging & autorelease
                CFRelease(val);
            }
		}
		else {
			propertyName = [[[TiContactsPerson multiValueProperties] allKeysForObject:[NSNumber numberWithInt:property]] objectAtIndex:0];
			ABMultiValueRef multival = ABRecordCopyValue(person, property);
			CFIndex index = ABMultiValueGetIndexForIdentifier(multival, identifier);

			CFTypeRef val = ABMultiValueCopyValueAtIndex(multival, index);
            if (val != NULL) {
                value = [[(id)val retain] autorelease]; // Force toll-free bridging & autorelease
                CFRelease(val);
            }
			
			CFStringRef CFlabel = ABMultiValueCopyLabelAtIndex(multival, index);
            NSArray* labelKeys = [[TiContactsPerson multiValueLabels] allKeysForObject:(NSString*)CFlabel];
            if ([labelKeys count] > 0) {
                label = [NSString stringWithString:[labelKeys objectAtIndex:0]];
            }
            else {
                // Hack for Exchange and other 'cute' setups where there is no label associated with a multival property;
                // in this case, force it to be the property name.
                if (CFlabel != NULL) {
                    label = [NSString stringWithString:(NSString*)CFlabel];
                }
                // There may also be cases where we get a property from the system that we can't handle, because it's undocumented or not in the map.
                else if (propertyName != nil) {
                    label = [NSString stringWithString:propertyName];
                }
            }
            if (CFlabel != NULL) {
                CFRelease(CFlabel);
            }
			
			CFRelease(multival);
		}
		
		NSDictionary* dict = [NSDictionary dictionaryWithObjectsAndKeys:personObject,@"person",propertyName,@"property",value,@"value",label,@"label",nil];
		[self _fireEventToListener:@"selectedProperty" withObject:dict listener:selectedPropertyCallback thisObject:nil];
		[[TiApp app] hideModalController:picker animated:animated];
		return NO;
	}
	return YES;
}

@end

#endif