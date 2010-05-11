/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS

#import <AddressBookUI/AddressBookUI.h>
#import "ContactsModule.h"
#import "TiContactsContactProxy.h"
#import "TiApp.h"

@implementation ContactsModule

#pragma mark Internal

-(void)dealloc
{
	CFRelease(addressBook);
	addressBook = nil;
	RELEASE_TO_NIL(pickerSuccessCallback);
	RELEASE_TO_NIL(pickerErrorCallback);
	RELEASE_TO_NIL(pickerCancelCallback);
	RELEASE_TO_NIL(pickerFields);
	RELEASE_TO_NIL(picker);
	[super dealloc];
}

-(ABAddressBookRef)addressBook
{
	if (addressBook==nil)
	{
		addressBook = ABAddressBookCreate();
	}
	
	return addressBook;
}

// caller is responsible for releasing
-(ABRecordRef)recordForId:(ABRecordID)rec
{
	return ABAddressBookGetPersonWithRecordID([self addressBook], rec);
}

#pragma mark Public APIs

MAKE_SYSTEM_STR(ADDRESS_STREET_1,@"street1");
MAKE_SYSTEM_STR(ADDRESS_STREET_2,@"street2");
MAKE_SYSTEM_STR(ADDRESS_CITY,@"city");
MAKE_SYSTEM_STR(ADDRESS_STATE,@"region1");
MAKE_SYSTEM_STR(ADDRESS_PROVINCE,@"region1");
MAKE_SYSTEM_STR(ADDRESS_SECONDARY_REGION,@"region2");
MAKE_SYSTEM_STR(ADDRESS_ZIP,@"postalCode");
MAKE_SYSTEM_STR(ADDRESS_POSTAL_CODE,@"postalCode");
MAKE_SYSTEM_STR(ADDRESS_COUNTRY,@"country");
MAKE_SYSTEM_STR(ADDRESS_COUNTRY_CODE,@"countryCode");


-(id)getAllContacts:(id)arg
{
	CFArrayRef contacts = ABAddressBookCopyArrayOfAllPeople([self addressBook]);
	int count = CFArrayGetCount(contacts);
	NSMutableArray *results = nil;
	if (count > 0)
	{
		results = [NSMutableArray arrayWithCapacity:count];
		for (int c=0;c<count;c++)
		{
			ABRecordRef contactRec = CFArrayGetValueAtIndex(contacts, c);
			TiContactsContactProxy *proxy = [[TiContactsContactProxy alloc] initWithPageContext:[self pageContext] contact:contactRec newRecord:NO];
			proxy.delegate = self;
			[results addObject:proxy];
			[proxy release];
		}
	}
	CFRelease(contacts);
	return results == nil ? [NSDictionary dictionary] : results;
}

-(id)createContact:(id)arg
{
	ABRecordRef contactRec = ABPersonCreate();
	TiContactsContactProxy *proxy = [[TiContactsContactProxy alloc] initWithPageContext:[self pageContext] contact:contactRec newRecord:YES];
	proxy.delegate = self;
	CFRelease(contactRec);
	return [proxy autorelease];
}

-(id)addContact:(id)arg
{
	if ([arg isKindOfClass:[NSDictionary class]])
	{
		TiContactsContactProxy *proxy = [self createContact:arg];
		[proxy updateFromDict:arg];
		[proxy save:nil];
		return proxy;
	}
	else if ([arg isKindOfClass:[TiContactsContactProxy class]])
	{
		return [self saveContact:arg];
	}
	return nil;
}

-(id)saveContact:(id)arg
{
	ENSURE_TYPE(arg,TiContactsContactProxy);
	if ([arg isNewRecord])
	{
		ABAddressBookAddRecord([self addressBook], [arg record], NULL);
	}
	ABAddressBookSave([self addressBook], NULL);
	return arg;
}

-(id)removeContact:(id)arg
{
	ENSURE_TYPE(arg,TiContactsContactProxy);
	if (![arg isNewRecord])
	{
		ABAddressBookRemoveRecord([self addressBook], [arg record], NULL);
		ABAddressBookSave([self addressBook], NULL);
	}
	return arg;
}

-(void)showContactPicker:(id)arg
{
	ENSURE_UI_THREAD(showContactPicker,arg);
	
	ENSURE_SINGLE_ARG(arg,NSDictionary);
	
	RELEASE_TO_NIL(pickerSuccessCallback);
	RELEASE_TO_NIL(pickerErrorCallback);
	RELEASE_TO_NIL(pickerCancelCallback);
	RELEASE_TO_NIL(picker);
	
	pickerSuccessCallback = [[arg objectForKey:@"success"] retain];
	pickerErrorCallback = [[arg objectForKey:@"error"] retain];
	pickerCancelCallback = [[arg objectForKey:@"cancel"] retain];

	picker = [[ABPeoplePickerNavigationController alloc] init];
	[picker setPeoplePickerDelegate:self];

	pickerAnimated = [TiUtils boolValue:@"animated" properties:arg def:YES];
	
	NSArray* details = [arg objectForKey:@"details"];
	ENSURE_TYPE_OR_NIL(details,NSArray);
	
	if (details!=nil)
	{
		pickerFields = [[NSMutableArray arrayWithCapacity:[details count]] retain];
		for (NSString * key in details) 
		{
			ABPropertyID propertyId = [TiContactsContactProxy propertyForKey:key];
			if (propertyId!=kABPropertyInvalidID)
			{
				[pickerFields addObject:[NSNumber numberWithInt:propertyId]];
			}
		}
		[picker setDisplayedProperties:pickerFields];
	}

	TiApp * tiApp = [TiApp app];
	//TODO: Make sure we only do this on iPhone, not iPad.
	[[tiApp controller] manuallyRotateToOrientation:UIInterfaceOrientationPortrait];
	[tiApp showModalController:picker animated:pickerAnimated];
}

-(void)dismissPickerWithEvent:(KrollCallback*)callback event:(id)event type:(NSString*)type
{
	[[TiApp app] hideModalController:picker animated:pickerAnimated];
	
	if (callback!=nil)
	{
		[self _fireEventToListener:type withObject:event listener:callback thisObject:nil];
	}

	RELEASE_TO_NIL(pickerSuccessCallback);
	RELEASE_TO_NIL(pickerErrorCallback);
	RELEASE_TO_NIL(pickerCancelCallback);
	RELEASE_TO_NIL(pickerFields);
	RELEASE_TO_NIL(picker);
}

#pragma mark Delegates

// Called after the user has pressed cancel
// The delegate is responsible for dismissing the peoplePicker
- (void)peoplePickerNavigationControllerDidCancel:(ABPeoplePickerNavigationController *)peoplePicker
{
	[self dismissPickerWithEvent:pickerCancelCallback event:nil type:@"cancel"];
}

// Called after a person has been selected by the user.
// Return YES if you want the person to be displayed.
// Return NO  to do nothing (the delegate is responsible for dismissing the peoplePicker).
- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person
{
	if (pickerFields!=nil)
	{
		return YES;
	}
	ABRecordID recordId = ABRecordGetRecordID(person);
	TiContactsContactProxy *proxy = [[TiContactsContactProxy alloc] initWithPageContext:[self pageContext] record:recordId];
	proxy.delegate = self;
	NSDictionary *event = [NSDictionary dictionaryWithObject:proxy forKey:@"contact"];
	[proxy release];
	[self dismissPickerWithEvent:pickerSuccessCallback event:event type:@"success"];
	return NO;
}

// Called after a value has been selected by the user.
// Return YES if you want default action to be performed.
// Return NO to do nothing (the delegate is responsible for dismissing the peoplePicker).
- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifier
{
	ABRecordID recordId = ABRecordGetRecordID(person);
	TiContactsContactProxy *proxy = [[TiContactsContactProxy alloc] initWithPageContext:[self pageContext] record:recordId];
	proxy.delegate = self;
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:proxy,@"contact",[TiContactsContactProxy stringForPropertyId:property],@"key",identifier,@"index",nil];
	[proxy release];
	[self dismissPickerWithEvent:pickerSuccessCallback event:event type:@"success"];
	return NO;
}


@end

#endif