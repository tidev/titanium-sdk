/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS
#import "TiContactsGroup.h"


@implementation TiContactsGroup

-(ABRecordRef)record
{
	// Force us to be on the main thread
	if (![NSThread isMainThread]) {
		return NULL;
	}
	
	if (record == NULL) {
		if (recordId != kABRecordInvalidID) {
			record = ABAddressBookGetGroupWithRecordID([module addressBook], recordId);
		}
	}
	return record;
}

-(NSNumber*)recordId
{
	return NUMINT(recordId);
}

-(id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule*)module_
{
	if (self = [super _initWithPageContext:context]) {
		recordId = id_;
		record = NULL;
		module = module_;
		returnCache = [[NSMutableDictionary alloc] init];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(returnCache)
	[super dealloc];
}

#pragma mark Public API

-(NSString*)name
{
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self name] retain];}, YES);
		return [result autorelease];
	}
	
	CFStringRef nameRef = ABRecordCopyValue([self record], kABGroupNameProperty);
    NSString* name = @"<unnamed group>";
    if (nameRef != NULL) {
        name = [NSString stringWithString:(NSString*)nameRef];
        CFRelease(nameRef);
    }
	
	[returnCache setObject:name forKey:@"name"];
	return name;
}

-(void)setName:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString)
	ENSURE_UI_THREAD(setName,arg)
	
	CFErrorRef error;
	if(!ABRecordSetValue([self record], kABGroupNameProperty, (CFStringRef)arg, &error)) {
		CFStringRef reason = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)reason];
		CFRelease(reason);
		[self throwException:[NSString stringWithFormat:@"Failed to set contact property name: %@",str]
				   subreason:nil
					location:CODELOCATION];
	}
}

-(NSArray*)members:(id)unused
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(members:) withObject:unused waitUntilDone:YES];
		return [returnCache objectForKey:@"members"];
	}
	
	CFArrayRef arrayRef = ABGroupCopyArrayOfAllMembers([self record]);
	if (arrayRef == NULL) {
		[returnCache setObject:[NSNull null] forKey:@"members"];
		return nil;
	}
	CFIndex count = CFArrayGetCount(arrayRef);
	NSMutableArray* members = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef personRef = CFArrayGetValueAtIndex(arrayRef, i);
		int id_ = ABRecordGetRecordID(personRef);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:module] autorelease];
		[members addObject:person];
	}
	CFRelease(arrayRef);
	
	[returnCache setObject:members forKey:@"members"];
	return members;
}

-(NSArray*)sortedMembers:(id)value
{
	ENSURE_SINGLE_ARG(value,NSNumber)
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(sortedMembers:) withObject:value waitUntilDone:YES];
		return [returnCache objectForKey:@"members"];
	}

	int sortType = [value intValue];
	switch(sortType) {
		case kABPersonSortByFirstName:
		case kABPersonSortByLastName:
			break;
		default:
			[returnCache setObject:[NSNull null] forKey:@"members"];
			[self throwException:[NSString stringWithFormat:@"Invalid sort value: %d",sortType]
					   subreason:nil
						location:CODELOCATION];
	}
	
	CFArrayRef arrayRef = ABGroupCopyArrayOfAllMembersWithSortOrdering([self record], sortType);
	if (arrayRef == NULL) {
		[returnCache setObject:[NSNull null] forKey:@"members"];
		return nil;
	}
	CFIndex count = CFArrayGetCount(arrayRef);
	NSMutableArray* members = [NSMutableArray arrayWithCapacity:count];
	for (CFIndex i=0; i < count; i++) {
		ABRecordRef personRef = CFArrayGetValueAtIndex(arrayRef, i);
		int id_ = ABRecordGetRecordID(personRef);
		TiContactsPerson* person = [[[TiContactsPerson alloc] _initWithPageContext:[self executionContext] recordId:id_ module:module] autorelease];
		[members addObject:person];
	}
	CFRelease(arrayRef);
	
	[returnCache setObject:members forKey:@"members"];
	return members;
}

-(void)add:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiContactsPerson)
	ENSURE_UI_THREAD(add,arg);

	CFErrorRef error;
	if (!ABGroupAddMember([self record], [arg record], &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to add person %@ to group %@: %@",[arg fullName],[self name],str]
				   subreason:nil
					location:CODELOCATION];
	}
}

-(void)remove:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiContactsPerson)
	ENSURE_UI_THREAD(remove,arg);
	
	CFErrorRef error;
	if (!ABGroupRemoveMember([self record], [arg record], &error)) {
		CFStringRef errorStr = CFErrorCopyDescription(error);
		NSString* str = [NSString stringWithString:(NSString*)errorStr];
		CFRelease(errorStr);
		
		[self throwException:[NSString stringWithFormat:@"Failed to remove person %@ to group %@: %@",[arg fullName],[self name],str]
				   subreason:nil
					location:CODELOCATION];
	}
}

@end
#endif