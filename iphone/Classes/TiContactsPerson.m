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
			ABAddressBookRef ourAddressBook = [module addressBook];
			if (ourAddressBook != NULL) {
				record = ABAddressBookGetPersonWithRecordID(ourAddressBook, recordId);
			}
		}
	}
	return record;
}

-(id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule*)module_
{
	if (self = [super _initWithPageContext:context]) {
		recordId = id_;
		record = NULL;
		module = module_;
	}
	return self;
}

-(void)dealloc
{
	[super dealloc];
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
			 NUMINT(kABPersonKindProperty),@"kind",
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
			 NUMINT(kABPersonDateProperty),@"date",
			 NUMINT(kABPersonURLProperty),@"url",
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
			 NUMINT(kABMultiDateTimePropertyType),NUMINT(kABPersonDateProperty),
			 NUMINT(kABMultiStringPropertyType),NUMINT(kABPersonURLProperty),
			 nil];
	}
	return multiValueTypes;
}

+(NSDictionary*)multiValueLabels
{
	if (multiValueLabels == nil) {
		multiValueLabels = 
			[[NSDictionary alloc] initWithObjectsAndKeys:(NSString*)kABHomeLabel,@"home", // Generic labels
			 kABWorkLabel,@"work",
			 kABOtherLabel,@"other",
			 kABPersonPhoneMobileLabel,@"mobile", // Phone labels
			 kABPersonPhonePagerLabel,@"pager",
			 kABPersonPhoneWorkFAXLabel,@"workFax",
			 kABPersonPhoneMainLabel,@"main",
			 kABPersonPhoneIPhoneLabel,@"iPhone",
			 kABPersonPhoneHomeFAXLabel,@"homeFax",
			 kABPersonInstantMessageServiceAIM,@"aim", // IM labels
			 kABPersonInstantMessageServiceICQ,@"icq",
			 kABPersonInstantMessageServiceJabber,@"jabber",
			 kABPersonInstantMessageServiceMSN,@"msn",
			 kABPersonInstantMessageServiceYahoo,@"yahoo",
			 kABPersonMotherLabel,@"mother", // Relation labels
			 kABPersonFatherLabel,@"father",
			 kABPersonParentLabel,@"parent",
			 kABPersonSisterLabel,@"sister",
			 kABPersonBrotherLabel,@"brother",
			 kABPersonChildLabel,@"child",
			 kABPersonFriendLabel,@"friend",
			 kABPersonSpouseLabel,@"spouse",
			 kABPersonPartnerLabel,@"partner",
			 kABPersonManagerLabel,@"manager",
			 kABPersonAssistantLabel,@"assistant",
			 kABPersonAnniversaryLabel,@"anniversary", // Date label
			 kABPersonHomePageLabel,@"homepage", // URL label
			 nil];
	}
	return multiValueLabels;
}

#pragma mark Multi-value property management

-(NSDictionary*)dictionaryFromMultiValue:(ABMultiValueRef)multiValue defaultKey:(NSString*)defaultKey
{
	NSMutableDictionary* dict = [NSMutableDictionary dictionary];

	CFIndex count = ABMultiValueGetCount(multiValue);
	for (CFIndex i = 0; i < count; i++) {
		CFStringRef label = ABMultiValueCopyLabelAtIndex(multiValue, i);
		CFTypeRef value = ABMultiValueCopyValueAtIndex(multiValue, i);
		
		NSString* readableLabel = nil;
		NSArray* labelKeys = [[TiContactsPerson multiValueLabels] allKeysForObject:(NSString*)label];
		if (labelKeys != nil && ([labelKeys count] > 0)) {
			readableLabel = [labelKeys objectAtIndex:0];
		}
		else {
            if (label == NULL) {
                readableLabel = defaultKey;
            }
            else {
                readableLabel = (NSString*)label;
            }
		}

		if ([dict valueForKey:readableLabel] == nil) {
			[dict setValue:[NSMutableArray array] forKey:readableLabel];
		}
		
		if (CFGetTypeID(value) == CFDateGetTypeID()) {
			// Dates still need special handling - we should make a TiDate object
			[[dict valueForKey:readableLabel] addObject:[TiUtils UTCDateForDate:(NSDate*)value]];
		}
		else {
			// This works as long as 'value' is toll-free bridged, which is (currently) true for all AB property types
			[[dict valueForKey:readableLabel] addObject:(id)value];
		}
		
        if (label != NULL) {
            CFRelease(label);
        }
		CFRelease(value);
	}
	
	return dict;
}

-(ABMultiValueRef)dictionaryToMultiValue:(NSDictionary*)dict type:(ABPropertyType)type
{
	ABMutableMultiValueRef multiValue = ABMultiValueCreateMutable(type);
	
	for (NSString* key in [dict allKeys]) {
		NSString* label = [[TiContactsPerson multiValueLabels] valueForKey:key];
		for (id value in [dict objectForKey:key]) {
			ABMultiValueAddValueAndLabel(multiValue, (CFTypeRef)value, (CFStringRef)label, NULL);
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
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self fullName] retain];}, YES);
		return [result autorelease];
	}
	
	CFStringRef name = ABRecordCopyCompositeName([self record]);
	NSString* nameStr = @"No name";
	if (name != NULL) {
		nameStr = [NSString stringWithString:(NSString*)name];		
		CFRelease(name);
	}
	
	return nameStr;
}

-(void)setImage:(id)value
{
	ENSURE_TYPE_OR_NIL(value,TiBlob);
	ENSURE_UI_THREAD(setImage,value)
	
	if (value == nil) {
		CFErrorRef error;
		if (ABPersonHasImageData([self record]) && !ABPersonRemoveImageData([self record],&error)) {
			CFStringRef errorStr = CFErrorCopyDescription(error);
			NSString* str = [NSString stringWithString:(NSString*)errorStr];
			CFRelease(errorStr);
			
			[self throwException:[NSString stringWithFormat:@"Failed to remove image: %@",str]
					   subreason:nil
						location:CODELOCATION];
		}
	}
	else {
		CFErrorRef error;		
		if (!ABPersonSetImageData([self record], (CFDataRef)[value data], &error)) {
			CFStringRef errorStr = CFErrorCopyDescription(error);
			NSString* str = [NSString stringWithString:(NSString*)errorStr];
			CFRelease(errorStr);
			
			[self throwException:[NSString stringWithFormat:@"Failed to set image: %@",str]
					   subreason:nil
						location:CODELOCATION];
		}
	}
}

-(TiBlob*)image
{
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self image] retain];}, YES);
		return [result autorelease];
	}
	CFDataRef imageData = ABPersonCopyImageData([self record]);
	if (imageData != NULL)
	{
		TiBlob* imageBlob = [[[TiBlob alloc] initWithImage:[UIImage imageWithData:(NSData*)imageData]] autorelease];
		CFRelease(imageData);
		
		return imageBlob;
	}
	else {
		return nil;
	}
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
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self valueForUndefinedKey:key] retain];}, YES);
		return [result autorelease];
	}
	
	id property = nil;
	// Single-value property
	if (property = [[TiContactsPerson contactProperties] valueForKey:key]) {
		// Okay, we have to do the bridging ourselves so that the result is autoreleased.
		CFTypeRef CFresult = ABRecordCopyValue([self record], [property intValue]);
		id result = [NSNull null];
		if (CFresult != NULL) {
			if (CFGetTypeID(CFresult) == CFStringGetTypeID()) {
				result = [NSString stringWithString:(NSString*)CFresult];
			}
			if (CFGetTypeID(CFresult) == CFDateGetTypeID()) {
				// TODO: Need better date handling based on locale
				result = [TiUtils UTCDateForDate:(NSDate*)CFresult];
			}
			CFRelease(CFresult);
		}
		
		return result;
	}
	// Multi-value property
	else if (property = [[TiContactsPerson multiValueProperties] valueForKey:key]) {
		ABPropertyID propertyID = [property intValue];
		ABMultiValueRef multiVal = ABRecordCopyValue([self record], propertyID);
		id value = [NSNull null];
		if (multiVal != NULL) {
			value = [self dictionaryFromMultiValue:multiVal defaultKey:key];
			CFRelease(multiVal);
		}
		return value;
	}
	// Something else
	else {
		id result = [super valueForUndefinedKey:key];
		return result;
	}
}

-(void)setValue:(id)value forUndefinedKey:(NSString*)key
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self setValue:value forUndefinedKey:key];}, YES);
		return;
	}

	id property = nil;
	// Single-value property
	if (property = [[TiContactsPerson contactProperties] valueForKey:key]) {
		CFErrorRef error;
		if(!ABRecordSetValue([self record], [property intValue], (CFTypeRef)value, &error)) {
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

@end

#endif