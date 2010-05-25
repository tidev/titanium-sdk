/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CONTACTS

#import "TiContactsPerson.h"
#import "ContactsModule.h"
#import "TiUtils.h"
#import "TiBlob.h"

static NSDictionary* contactProperties;
static NSDictionary* multiValueProperties;
static NSDictionary* multiValueTypes;
static NSDictionary* multiValueLabels;

@implementation TiContactsPerson

#pragma mark Internals

-(ABRecordRef)record
{
	// Force us to be on the main thread
	if (![NSThread isMainThread]) {
		return NULL;
	}
	
	if (record == NULL) {
		if (recordId != kABRecordInvalidID) {
			record = ABAddressBookGetPersonWithRecordID([module addressBook], recordId);
		}
		else {
			record = ABPersonCreate();
		}
	}
	return record;
}

-(void)releaseRecord
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(releaseRecord) withObject:nil waitUntilDone:YES];
		return;
	}
	
	CFRelease(record);
	record = NULL;
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
	[self releaseRecord];
	[super dealloc];
}

-(void)wasCommitted
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(wasCommitted) withObject:nil waitUntilDone:YES];
		return;
	}
	
	recordId = ABRecordGetRecordID(record);
	[self releaseRecord];
}

#pragma mark Property dictionaries

// -kABPerson non-multi properties
+(NSDictionary*)contactProperties
{
	if (contactProperties == nil) {
		contactProperties = 
			[[NSDictionary alloc] initWithObjectsAndKeys:NUMINT(kABPersonFirstNameProperty), @"firstName",
			 NUMINT(kABPersonLastNameProperty), @"lastName",
			 NUMINT(kABPersonMiddleNameProperty), @"middleName",
			 NUMINT(kABPersonPrefixProperty), @"prefix",
			 NUMINT(kABPersonSuffixProperty), @"suffix",
			 NUMINT(kABPersonNicknameProperty), @"nickname",
			 NUMINT(kABPersonFirstNamePhoneticProperty), @"firstPhonetic",
			 NUMINT(kABPersonLastNamePhoneticProperty), @"lastPhonetic",
			 NUMINT(kABPersonMiddleNamePhoneticProperty), @"middlePhonetic",
			 NUMINT(kABPersonOrganizationProperty), @"organization",
			 NUMINT(kABPersonJobTitleProperty), @"jobTitle",
			 NUMINT(kABPersonDepartmentProperty), @"department",
			 NUMINT(kABPersonNoteProperty), @"note",
			 NUMINT(kABPersonBirthdayProperty), @"birthday",
			 NUMINT(kABPersonCreationDateProperty), @"created",
			 NUMINT(kABPersonModificationDateProperty), @"modified",
			 nil];
	}
	return contactProperties;
}

+(NSDictionary*)multiValueProperties
{
	if (multiValueProperties == nil) {
		multiValueProperties = 
		[[NSDictionary alloc] initWithObjectsAndKeys:NUMINT	(kABPersonEmailProperty),@"email",
		 NUMINT(kABPersonAddressProperty),@"address",
		 NUMINT(kABPersonPhoneProperty),@"phone",
		 NUMINT(kABPersonInstantMessageProperty),@"instantMessage",
		 NUMINT(kABPersonRelatedNamesProperty),@"relatedNames",
		 nil];
	}
	return multiValueProperties;
}

+(NSDictionary*)multiValueTypes
{
	if (multiValueTypes == nil) {
		multiValueTypes =
		[[NSDictionary alloc] initWithObjectsAndKeys:NUMINT(kABMultiStringPropertyType),NUMINT(kABPersonEmailProperty),
		 NUMINT(kABMultiDictionaryPropertyType),NUMINT(kABPersonAddressProperty),
		 NUMINT(kABMultiStringPropertyType),NUMINT(kABPersonPhoneProperty),
		 NUMINT(kABMultiDictionaryPropertyType),NUMINT(kABPersonInstantMessageProperty),
		 NUMINT(kABMultiStringPropertyType),NUMINT(kABPersonRelatedNamesProperty),
		 nil];
	}
	return multiValueTypes;
}

#pragma mark Multi-value property management

-(NSDictionary*)dictionaryFromMultiValue:(ABMultiValueRef)multiValue
{
	NSMutableDictionary* dict = [NSMutableDictionary dictionary];

	CFIndex count = ABMultiValueGetCount(multiValue);
	for (CFIndex i = 0; i < count; i++) {
		CFStringRef label = ABMultiValueCopyLabelAtIndex(multiValue, i);
		CFStringRef value = ABMultiValueCopyValueAtIndex(multiValue, i);
		
		if ([dict valueForKey:(NSString*)label] == nil) {
			[dict setValue:[NSMutableArray array] forKey:(NSString*)label];
		}
		// This works as long as 'value' is toll-free bridged, which is (currently) true for all AB property types
		[[dict valueForKey:(NSString*)label] addObject:(id)value];
		
		CFRelease(label);
		CFRelease(value);
	}
	
	return dict;
}

-(ABMultiValueRef)dictionaryToMultiValue:(NSDictionary*)dict type:(ABPropertyType)type
{
	ABMutableMultiValueRef multiValue = ABMultiValueCreateMutable(type);
	
	for (NSString* key in [dict allKeys]) {
		for (id value in [dict objectForKey:key]) {
			ABMultiValueAddValueAndLabel(multiValue, (CFTypeRef)value, (CFStringRef)key, NULL);
		}
	}
	
	return multiValue;
}

#pragma mark Property management

-(NSNumber*)recordId
{
	return NUMINT(recordId);
}

-(NSString*)fullName
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(fullName) withObject:nil waitUntilDone:YES];
		return [returnCache objectForKey:@"fullName"];
	}
	
	CFStringRef name = ABRecordCopyCompositeName([self record]);
	NSString* nameStr = [NSString stringWithString:(NSString*)name];
	CFRelease(name);
	
	[returnCache setObject:nameStr forKey:@"fullName"];
	return nameStr;
}

// TODO: We need better date handling, this takes UTC dates only.
-(void)setBirthday:(NSString*)date
{
	ENSURE_UI_THREAD(setBirthday, date)
	ABRecordSetValue([self record], kABPersonBirthdayProperty, (CFDateRef)[TiUtils dateForUTCDate:date], NULL);
}

-(id)valueForUndefinedKey:(NSString *)key
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(valueForUndefinedKey:) withObject:key waitUntilDone:YES];
		return [returnCache objectForKey:key];
	}
	
	id property = nil;
	// Single-value property
	if (property = [[TiContactsPerson contactProperties] valueForKey:key]) {
		// Okay, we have to do the bridging ourselves so that the result is autoreleased.
		CFTypeRef CFresult = ABRecordCopyValue([self record], [property intValue]);
		id result = nil;
		if (CFGetTypeID(CFresult) == CFStringGetTypeID()) {
			result = [NSString stringWithString:(NSString*)result];
		}
		if (CFGetTypeID(CFresult) == CFDateGetTypeID()) {
			// TODO: Need better date handling based on locale
			result = [TiUtils UTCDateForDate:(NSDate*)CFresult];
		}
		CFRelease(CFresult);
		
		[returnCache setObject:result forKey:key];
		return result;
	}
	// Multi-value property
	else if (property = [[TiContactsPerson multiValueProperties] valueForKey:key]) {
		ABPropertyID propertyID = [property intValue];
		ABMultiValueRef multiVal = ABRecordCopyValue([self record], propertyID);
		NSDictionary* dict = [self dictionaryFromMultiValue:multiVal];
		CFRelease(multiVal);
		
		[returnCache setObject:dict forKey:key];
		return dict;
	}
	// Something else
	else {
		id result = [super valueForUndefinedKey:key];
		[returnCache setObject:result forKey:key];
		return result;
	}
}

-(void)setValueImpl:(NSArray*)pair
{
	id value = [pair objectAtIndex:0];
	NSString* key = [pair objectAtIndex:1];
	
	id property = nil;
	// Single-value property
	if (property = [[TiContactsPerson contactProperties] valueForKey:key]) {
		// Again, taking advantage of the fact we only work with CFStringRefs; this could get
		// more complicated if contacts is expanded.
		NSString* stringVal = [TiUtils stringValue:value];
		CFErrorRef error;
		if(!ABRecordSetValue([self record], [property intValue], (CFStringRef)stringVal, &error)) {
			CFStringRef reason = CFErrorCopyDescription(error);
			NSString* str = [NSString stringWithString:(NSString*)reason];
			CFRelease(reason);
			[self throwException:[NSString stringWithFormat:@"Failed to set contact property %@: %@", key, str]
					   subreason:nil
						location:CODELOCATION];
		}
	}
	// Multi-value property
	else if (property = [[TiContactsPerson multiValueProperties] valueForKey:key]) {
		ENSURE_TYPE(value, NSDictionary)
		ABPropertyID propertyID = [property intValue];
		int type = [[[TiContactsPerson multiValueTypes] objectForKey:property] intValue];
		
		ABMultiValueRef multiVal = [self dictionaryToMultiValue:value type:type];
		CFErrorRef error;
		if (!ABRecordSetValue([self record], propertyID, multiVal, &error)) {
			CFRelease(multiVal);
			
			CFStringRef reason = CFErrorCopyDescription(error);
			NSString* str = [NSString stringWithString:(NSString*)reason];
			CFRelease(reason);
			[self throwException:[NSString stringWithFormat:@"Failed to set contact property %@: %@", key, str]
					   subreason:nil
						location:CODELOCATION];
		}
		CFRelease(multiVal);
	}
	// Something else
	else {
		[super setValue:value forUndefinedKey:key];
	}
}

-(void)setValue:(id)value forUndefinedKey:(NSString*)key
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(setValueImpl:) withObject:[NSArray arrayWithObjects:value,key,nil] waitUntilDone:YES];
	}
	[self setValueImpl:[NSArray arrayWithObjects:value,key,nil]];
}

@end

#endif