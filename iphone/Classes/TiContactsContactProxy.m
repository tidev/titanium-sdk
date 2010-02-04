/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiContactsContactProxy.h"
#import "ContactsModule.h"
#import "TiUtils.h"
#import "TiBlob.h"

static NSDictionary *contactKeysDictionary;

// convert from an AddressBook native type into a suitable NSDictionary to return to JS
NSDictionary * ConvertAddressFromNativeFormat(NSDictionary * inputDict)
{
	NSMutableDictionary * result = [NSMutableDictionary dictionary];
	
	NSString * street = [inputDict objectForKey:(id)kABPersonAddressStreetKey];
	NSString * city = [inputDict objectForKey:(id)kABPersonAddressCityKey];
	NSString * region1 = [inputDict objectForKey:(id)kABPersonAddressStateKey];
	NSString * region2 = [inputDict objectForKey:@"Region"];
	NSString * postalCode = [inputDict objectForKey:(id)kABPersonAddressZIPKey];
	NSString * country = [inputDict objectForKey:(id)kABPersonAddressCountryKey];
	NSString * countryCode = [inputDict objectForKey:(id)kABPersonAddressCountryCodeKey];
	
	NSMutableString * displayAddress = [NSMutableString string];
	if ([street length]>0) 
	{
		NSRange returnKey = [street rangeOfString:@"\n"];
		if (returnKey.location == NSNotFound) 
		{
			[result setObject:street forKey:@"street1"];
		} 
		else 
		{
			[result setObject:[street substringToIndex:returnKey.location] forKey:@"street1"];
			[result setObject:[street substringFromIndex:returnKey.location+1] forKey:@"street2"];
		}
		[displayAddress appendString:street];
	}
	
	[result setValue:city forKey:@"city"];
	[result setValue:region1 forKey:@"region1"];
	[result setValue:region2 forKey:@"region2"];
	[result setValue:postalCode forKey:@"postalCode"];
	[result setValue:country forKey:@"country"];
	[result setValue:countryCode forKey:@"countryCode"];
	
	if (region2 != nil) 
	{
		if(city != nil)
		{
			[displayAddress appendFormat:@"\n%@",city];
		}
		
		[displayAddress appendFormat:@"\n%@",region2];
		if (region1 != nil) 
		{
			[displayAddress appendFormat:@" %@",region1];
		}
		
		if (postalCode != nil)
		{
			[displayAddress appendFormat:@"\n%@",postalCode];
		}
		
	} 
	else 
	{
		BOOL addedLine=NO;
		if (city != nil) 
		{
			[displayAddress appendFormat:@"\n%@",city];
			addedLine = YES;
		}
		
		if (region1 != nil) 
		{
			if (addedLine) 
			{
				[displayAddress appendFormat:@" %@",region1];
			} 
			else 
			{
				[displayAddress appendFormat:@"\n%@",region1];
				addedLine = YES;
			}
		}
		
		
		if (postalCode != nil)
		{
			if (addedLine) 
			{
				[displayAddress appendFormat:@" %@",postalCode];
			} 
			else 
			{
				[displayAddress appendFormat:@"\n%@",postalCode];
			}
		}
	}
	
	NSLocale * ourLocale = [NSLocale currentLocale];
	if(([countryCode length]>0) && ![countryCode isEqual:[ourLocale objectForKey:NSLocaleCountryCode]])
	{
		[displayAddress appendFormat:@"\n%@",country];
	}	
	
	[result setValue:displayAddress forKey:@"displayAddress"];

	return result;
}

// convert a JS type Dictionary to a Native Format
NSDictionary * ConvertAddressToNativeFormat(NSDictionary * inputDict)
{
	NSMutableDictionary * result = [NSMutableDictionary dictionary];
	
	NSString * street1 = [inputDict objectForKey:@"street1"];
	NSString * street2 = [inputDict objectForKey:@"street2"];
	
	if((street1 != nil) && (street2 != nil))
	{
		[result setObject:[NSString stringWithFormat:@"%@\n%@",street1,street2]
				   forKey:(id)kABPersonAddressStreetKey];
	} 
	else if ((street1 != nil)) 
	{
		[result setObject:street1 forKey:(id)kABPersonAddressStreetKey];
	} 
	else if ((street2 != nil)) 
	{
		[result setObject:[@"\n" stringByAppendingString:street1] forKey:(id)kABPersonAddressStreetKey];
	}
	[result setValue:[inputDict objectForKey:@"city"] forKey:(id)kABPersonAddressCityKey];
	[result setValue:[inputDict objectForKey:@"region1"] forKey:(id)kABPersonAddressStateKey];
	[result setValue:[inputDict objectForKey:@"region2"] forKey:@"Region"];
	[result setValue:[inputDict objectForKey:@"postalCode"] forKey:(id)kABPersonAddressZIPKey];
	
	[result setValue:[inputDict objectForKey:@"country"] forKey:(id)kABPersonAddressCountryKey];
	[result setValue:[inputDict objectForKey:@"countryCode"] forKey:(id)kABPersonAddressCountryCodeKey];
	
	return result;
}


@implementation TiContactsContactProxy

@synthesize delegate, newRecord;

-(id)initWithPageContext:(id<TiEvaluator>)context contact:(ABRecordRef)contact newRecord:(BOOL)newRecord_
{
	if (self = [super _initWithPageContext:context])
	{
		record = CFRetain(contact);
		newRecord = newRecord_;
	}
	return self;
}

-(id)initWithPageContext:(id<TiEvaluator>)context record:(ABRecordID)recordId_
{
	if (self = [super _initWithPageContext:context])
	{
		recordId = recordId_;
		record = nil;
		newRecord = NO;
	}
	return self;
}

-(void)dealloc
{
	CFRelease(record);
	[super dealloc];
}


-(ABRecordRef)record
{
	if (record==nil)
	{
		record = [delegate recordForId:recordId];
		CFRetain(record); //TODO: review retain?
	}
	return record;
}

+(void)ensureContactKeysDictionary
{
	if (contactKeysDictionary==nil)
	{
		contactKeysDictionary = [[NSDictionary alloc] initWithObjectsAndKeys:
								 [NSNumber numberWithInt:kABPersonFirstNameProperty],@"firstName",
								 [NSNumber numberWithInt:kABPersonLastNameProperty],@"lastName",
								 [NSNumber numberWithInt:kABPersonMiddleNameProperty],@"middleName",
								 [NSNumber numberWithInt:kABPersonPrefixProperty],@"prefix",
								 [NSNumber numberWithInt:kABPersonSuffixProperty],@"suffix",
								 [NSNumber numberWithInt:kABPersonNicknameProperty],@"nickname",
								 [NSNumber numberWithInt:kABPersonFirstNamePhoneticProperty],@"phoneticFirstName",
								 [NSNumber numberWithInt:kABPersonLastNamePhoneticProperty],@"phoneticLastName",
								 [NSNumber numberWithInt:kABPersonMiddleNamePhoneticProperty],@"phoneticMiddleName",
								 [NSNumber numberWithInt:kABPersonOrganizationProperty],@"organization",
								 [NSNumber numberWithInt:kABPersonJobTitleProperty],@"jobTitle",
								 [NSNumber numberWithInt:kABPersonDepartmentProperty],@"department",
								 [NSNumber numberWithInt:kABPersonEmailProperty],@"email",
								 [NSNumber numberWithInt:kABPersonBirthdayProperty],@"birthday",
								 [NSNumber numberWithInt:kABPersonNoteProperty],@"note",
								 [NSNumber numberWithInt:kABPersonCreationDateProperty],@"creationDate",
								 [NSNumber numberWithInt:kABPersonModificationDateProperty],@"modificationDate",
								 [NSNumber numberWithInt:kABPersonAddressProperty],@"address",
								 [NSNumber numberWithInt:kABPersonDateProperty],@"date",
								 [NSNumber numberWithInt:kABPersonPhoneProperty],@"phone",
								 [NSNumber numberWithInt:kABPersonInstantMessageProperty],@"instantMessenger",
								 [NSNumber numberWithInt:kABPersonURLProperty],@"url",
								 [NSNumber numberWithInt:kABPersonRelatedNamesProperty],@"relatives",
								 nil];
	}
	
}

+(ABPropertyID)propertyForKey:(id)key
{
	[TiContactsContactProxy ensureContactKeysDictionary];
	NSNumber *result = [contactKeysDictionary objectForKey:key];
	return [TiUtils intValue:result def:kABPropertyInvalidID];
}

+(NSString*)stringForPropertyId:(ABPropertyID)propertyId
{
	[TiContactsContactProxy ensureContactKeysDictionary];
	NSArray	* keys = [contactKeysDictionary allKeysForObject:[NSNumber numberWithInt:propertyId]];
	if([keys count]<1)return nil;
	return [keys objectAtIndex:0];
}

-(BOOL)keyIsImageProperty:(NSString*)key
{
	return [key isEqualToString:@"imageData"];
}

#define SAVE_RECORD_IF_STRING(resultRecord, propertyID, savedValue)	\
if([savedValue respondsToSelector:@selector(stringValue)])savedValue = [savedValue stringValue];	\
if([savedValue isKindOfClass:[NSString class]]){\
ABRecordSetValue(resultRecord, propertyID, (CFTypeRef)savedValue, NULL);	\
} else {	\
ABRecordRemoveValue(resultRecord, propertyID, NULL);	\
}

-(void)setValue:(id)value forUndefinedKey: (NSString *) key
{
	if ([self keyIsImageProperty:key])
	{
		ABPersonRemoveImageData([self record], NULL);
		if ([value isKindOfClass:[TiBlob class]])
		{
			ABPersonSetImageData(record, (CFDataRef)[(TiBlob*)value data], NULL);
		}
		else 
		{
			//TODO: do we want to support a path/url too?
		}
		return;
	}
	ABPropertyID propertyId = [TiContactsContactProxy propertyForKey:key];
	if (propertyId==kABPropertyInvalidID)
	{
		[super setValue:value forUndefinedKey:key];
		return;
	}
	
	// setting to nil is the same as removing the property
	if (value == nil)
	{
		ABRecordRemoveValue([self record], propertyId, NULL);
		return;
	}
	
	ABPropertyType propertyType = ABPersonGetTypeOfProperty(propertyId);
	
	if (propertyId == kABPersonNoteProperty)
	{
		id note = nil;
		if ([value isKindOfClass:[NSArray class]] && ([value count]>0)) 
		{
			NSDictionary * thisValueDict = [value objectForKey:0];
			if ([thisValueDict isKindOfClass:[NSDictionary class]]) 
			{
				note = [thisValueDict objectForKey:@"value"];
			}
		}
		SAVE_RECORD_IF_STRING([self record],propertyId,note);
	}
	else if (propertyId & kABMultiValueMask)
	{
		ABMutableMultiValueRef thisMultiValue = ABMultiValueCreateMutable(propertyType);
		for (NSDictionary * thisEntryDictionary in value) 
		{
			if (propertyId == kABPersonAddressProperty) 
			{
				ABMultiValueAddValueAndLabel(thisMultiValue,
											 (CFTypeRef)ConvertAddressToNativeFormat([thisEntryDictionary objectForKey:@"value"]),
											 (CFStringRef)[thisEntryDictionary objectForKey:@"label"], NULL);
			}
			else 
			{
				ABMultiValueAddValueAndLabel(thisMultiValue,
											 (CFTypeRef)[thisEntryDictionary objectForKey:@"value"],
											 (CFStringRef)[thisEntryDictionary objectForKey:@"label"], NULL);
			}
		}
		ABRecordSetValue([self record], propertyId, thisMultiValue, NULL);
		CFRelease(thisMultiValue);
	}
	else if (propertyId == kABPersonOrganizationProperty)
	{
		id organization = nil;
		id jobTitle = nil;
		id department = nil;
		if ([value isKindOfClass:[NSArray class]] && ([value count]>0)) 
		{
			NSDictionary * thisValueDict = [value objectForKey:0];
			if ([thisValueDict isKindOfClass:[NSDictionary class]]) 
			{
				NSDictionary * organizationDict = [thisValueDict objectForKey:@"value"];
				if ([organizationDict isKindOfClass:[NSDictionary class]]) 
				{
					organization = [organizationDict objectForKey:@"organization"];
					jobTitle = [organizationDict objectForKey:@"jobTitle"];
					department = [organizationDict objectForKey:@"department"];
				}
			}
		}
		SAVE_RECORD_IF_STRING([self record],propertyId,organization);
		SAVE_RECORD_IF_STRING([self record],kABPersonJobTitleProperty,jobTitle);
		SAVE_RECORD_IF_STRING([self record],kABPersonDepartmentProperty,department);
	}
	else
	{
		ABRecordSetValue([self record], propertyId, (CFTypeRef)value, NULL);
	}
}

-(id)valueForUndefinedKey:(NSString *)key
{
	if ([self keyIsImageProperty:key])
	{
		TiBlob *blob = nil;
		if (ABPersonHasImageData([self record])) 
		{
			CFDataRef imageData = ABPersonCopyImageData([self record]);
			blob = [[[TiBlob alloc] initWithData:(NSData*)imageData mimetype:@"image/jpeg"] autorelease];
			CFRelease(imageData);
		}
		return blob;
	}
	ABPropertyID propertyId = [TiContactsContactProxy propertyForKey:key];
	if (propertyId==kABPropertyInvalidID)
	{
		return nil;
	}
	CFTypeRef property = ABRecordCopyValue([self record], propertyId);
	if (property==nil)
	{
		return [NSNull null];
	}
	ABPropertyType propertyType = ABPersonGetTypeOfProperty(propertyId);
	if (propertyType & kABMultiValueMask) 
	{
		int propertyCount = ABMultiValueGetCount(property);
		NSMutableArray *result = [NSMutableArray arrayWithCapacity:propertyCount];
		for (int propertyIndex=0; propertyIndex<propertyCount; propertyIndex++) 
		{
			CFStringRef propertyLabel = ABMultiValueCopyLabelAtIndex(property, propertyIndex);
			CFTypeRef propertyValue = ABMultiValueCopyValueAtIndex(property, propertyIndex);
			if(propertyId == kABPersonAddressProperty)
			{
				[result addObject:[NSDictionary dictionaryWithObjectsAndKeys:
								   (NSString *)propertyLabel,@"label",
								   ConvertAddressFromNativeFormat((NSDictionary *)propertyValue),@"value",nil]];
			} 
			else 
			{
				[result addObject:[NSDictionary dictionaryWithObjectsAndKeys:
								   (NSString *)propertyLabel,@"label",(id)propertyValue,@"value",nil]];
			}			
			CFRelease(propertyValue);
			CFRelease(propertyLabel);
		}
		CFRelease(property);
		return result;
	}
	else if (propertyId == kABPersonNoteProperty)
	{
		NSArray *result = [NSArray arrayWithObject:[NSDictionary dictionaryWithObjectsAndKeys:
										   @"notes",@"label",(id)property,@"value",nil]];
		CFRelease(property);
		return result;
	}
	else if (propertyId == kABPersonOrganizationProperty)
	{
		NSMutableDictionary * organizationDict = [[NSMutableDictionary alloc] initWithCapacity:3];
		if (property!=NULL) 
		{
			[organizationDict setObject:(id)property forKey:@"company"];
			CFRelease(property);
		}
		property = ABRecordCopyValue([self record], kABPersonDepartmentProperty);
		if (property!=NULL) 
		{
			[organizationDict setObject:(id)property forKey:@"department"];
			CFRelease(property);
		}
		property = ABRecordCopyValue([self record], kABPersonJobTitleProperty);
		if (property!=NULL) 
		{
			[organizationDict setObject:(id)property forKey:@"jobTitle"];
		}
		
		NSArray *result = [NSArray arrayWithObject:[NSDictionary dictionaryWithObjectsAndKeys:
										   (id)kABWorkLabel,@"label",(id)organizationDict,@"value",nil]];
		[organizationDict release];
		CFRelease(property);
		return result;
	}
	return [(id)property autorelease];
}

-(void)updateFromDict:(NSDictionary*)dict
{
	for (NSString *key in [dict allKeys])
	{
		id value = [dict objectForKey:key];
		[self setValue:value forUndefinedKey:key];
	}
}

#pragma mark Public APIs

-(id)save:(id)args
{
	[delegate saveContact:self];
	newRecord = NO;
	return self;
}

-(id)remove:(id)args
{
	[delegate removeContact:self];
	newRecord = YES;
	return self;
}

@end
