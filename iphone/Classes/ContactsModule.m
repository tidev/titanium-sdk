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
#import "TiApp.h"

@implementation ContactsModule

// We'll force the address book to only be accessed on the main thread, for consistency.  Otherwise
// we could run into cross-thread memory issues.
-(ABAddressBookRef)addressBook
{
	if (![NSThread isMainThread]) {
		return NULL;
	}
	
	if (addressBook == NULL) {
		addressBook = ABAddressBookCreate();
	}
	return addressBook;
}

-(void)releaseAddressBook
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(releaseAddressBook) withObject:nil waitUntilDone:YES];
		return;
	}
	CFRelease(addressBook);
}

-(void)startup
{
	[super startup];
	addressBook = NULL;
	returnCache = [[NSMutableDictionary alloc] init];
}

-(void)dealloc
{
	RELEASE_TO_NIL(picker)
	RELEASE_TO_NIL(cancelCallback)
	RELEASE_TO_NIL(selectedPersonCallback)
	RELEASE_TO_NIL(selectedPropertyCallback)
	RELEASE_TO_NIL(returnCache);
	
	[self releaseAddressBook];
	[super dealloc];
}

#pragma mark Public API

-(void)save:(id)unused
{
	ENSURE_UI_THREAD(save, unused)
	if (ABAddressBookHasUnsavedChanges([self addressBook])) {
		CFErrorRef error;
		if (!ABAddressBookSave([self addressBook], &error)) {
			CFStringRef errorStr = CFErrorCopyDescription(error);
			NSString* str = [NSString stringWithString:(NSString*)errorStr];
			CFRelease(errorStr);
			
			[self throwException:[NSString stringWithFormat:@"Unable to save address book: %@",str]
					   subreason:nil
						location:CODELOCATION];
		}
	}
}

-(void)revert:(id)unused
{
	ENSURE_UI_THREAD(revert, unused)
	if (ABAddressBookHasUnsavedChanges([self addressBook])) {
		ABAddressBookRevert([self addressBook]);
	}
}

-(void)showContacts:(id)args
{
	ENSURE_UI_THREAD(showContacts, args);
	ENSURE_SINGLE_ARG(args, NSDictionary)
	
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
	ENSURE_SINGLE_ARG(arg,NSNumber)                    
	return [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:[arg intValue] module:self] autorelease];
}

-(NSArray*)getPeopleWithName:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString)
	
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(getPeopleWithName:) withObject:arg waitUntilDone:YES];
		return [returnCache objectForKey:@"peopleWithName"];
	}
	
	CFArrayRef peopleRefs = ABAddressBookCopyPeopleWithName([self addressBook], (CFStringRef)arg);
	CFIndex count = CFArrayGetCount(peopleRefs);
	NSMutableArray* people = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef ref = CFArrayGetValueAtIndex(peopleRefs, i);
		ABRecordID id_ = ABRecordGetRecordID(ref);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[people addObject:person];
	}	
	CFRelease(peopleRefs);
	
	[returnCache setObject:people forKey:@"peopleWithName"];
	return people;
}

-(NSArray*)getAllPeople:(id)unused
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(getAllPeople:) withObject:unused waitUntilDone:YES];
		return [returnCache objectForKey:@"allPeople"];
	}
	
	CFArrayRef peopleRefs = ABAddressBookCopyArrayOfAllPeople([self addressBook]);
	CFIndex count = CFArrayGetCount(peopleRefs);
	NSMutableArray* people = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef ref = CFArrayGetValueAtIndex(peopleRefs, i);
		ABRecordID id_ = ABRecordGetRecordID(ref);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
		[people addObject:person];
	}	
	CFRelease(peopleRefs);
	
	[returnCache setObject:people forKey:@"allPeople"];
	return people;
}

-(TiContactsPerson*)createPerson:(id)arg
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(createPerson:) withObject:arg waitUntilDone:YES];
		return [returnCache objectForKey:@"newPerson"];
	}
	
	ABRecordRef record = ABPersonCreate();
	CFErrorRef error;
	if (!ABAddressBookAddRecord([self addressBook], record, &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to add person: %@",str]
				   subreason:nil
					location:CODELOCATION];
	}
	[self save:nil];
	
	ABRecordID id_ = ABRecordGetRecordID(record);
	TiContactsPerson* newPerson = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self] autorelease];
	
	[returnCache setObject:newPerson forKey:@"newPerson"];
	return newPerson;
}

-(void)removePerson:(id)arg
{
	ENSURE_UI_THREAD(removePerson,arg)
	ENSURE_SINGLE_ARG(arg,TiContactsPerson)
	
	CFErrorRef error;
	if (!ABAddressBookRemoveRecord([self addressBook], [arg record], &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to remove person: %@",str]
				   subreason:nil
					location:CODELOCATION];
	}
}

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
		TiContactsPerson* person = [[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self];
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
		TiContactsPerson* personObject = [[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:self];
		NSString* propertyName = nil;
		id value = nil;
		id label = [NSNull null];
		if (identifier == kABMultiValueInvalidIdentifier) { 
			propertyName = [[[TiContactsPerson contactProperties] allKeysForObject:[NSNumber numberWithInt:property]] objectAtIndex:0];
			CFTypeRef val = ABRecordCopyValue(person, property);
			value = [[(id)val retain] autorelease]; // Force toll-free bridging & autorelease
			CFRelease(val);
		}
		else {
			propertyName = [[[TiContactsPerson multiValueProperties] allKeysForObject:[NSNumber numberWithInt:property]] objectAtIndex:0];
			ABMultiValueRef multival = ABRecordCopyValue(person, property);
			CFIndex index = ABMultiValueGetIndexForIdentifier(multival, identifier);

			CFTypeRef val = ABMultiValueCopyValueAtIndex(multival, index);
			value = [[(id)val retain] autorelease]; // Force toll-free bridging & autorelease
			CFRelease(val);
			
			CFStringRef CFlabel = ABMultiValueCopyLabelAtIndex(multival, index);
			label = [NSString stringWithString:[[[TiContactsPerson multiValueLabels] allKeysForObject:(NSString*)CFlabel] objectAtIndex:0]];
			CFRelease(CFlabel);
			
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