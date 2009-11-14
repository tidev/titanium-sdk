/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ContactsModule.h"

#import <AddressBookUI/AddressBookUI.h>
#import "TitaniumBlobWrapper.h"
#import "TitaniumViewController.h"

BOOL ContactKeyIsImageDataKey(NSString * contactKey){
	return [@"imageData" isEqual:contactKey];
}

NSDictionary * PropertyIDDictionary = nil;

void EnsurePropertyIDDictionary(){
	if (PropertyIDDictionary != nil) return;
	PropertyIDDictionary = [[NSDictionary alloc] initWithObjectsAndKeys:
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
//			[NSNumber numberWithInt:kABPersonJobTitleProperty],@"jobTitle",
//			[NSNumber numberWithInt:kABPersonDepartmentProperty],@"department",
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

ABPropertyID PropertyIDForContactKey(NSString * contactKey){
	EnsurePropertyIDDictionary();
	NSNumber * result = [PropertyIDDictionary objectForKey:contactKey];
	if(result != nil) return [result intValue];
	return -1;
}

NSString * ContactKeyForPropertyID(ABPropertyID propertyID){
	EnsurePropertyIDDictionary();
	NSArray	* keys = [PropertyIDDictionary allKeysForObject:[NSNumber numberWithInt:propertyID]];
	if([keys count]<1)return nil;
	return [keys objectAtIndex:0];
}

NSDictionary * ConvertAddressToNativeFormat(NSDictionary * inputDict){
	NSMutableDictionary * result = [NSMutableDictionary dictionary];
	
	NSString * street1 = [inputDict objectForKey:@"street1"];
	NSString * street2 = [inputDict objectForKey:@"street2"];

	if((street1 != nil) && (street2 != nil)){
		[result setObject:[NSString stringWithFormat:@"%@\n%@",street1,street2]
				forKey:(id)kABPersonAddressStreetKey];
	} else if ((street1 != nil)) {
		[result setObject:street1 forKey:(id)kABPersonAddressStreetKey];
	} else if ((street2 != nil)) {
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

NSDictionary * ConvertAddressFromNativeFormat(NSDictionary * inputDict){
	NSMutableDictionary * result = [NSMutableDictionary dictionary];

	
	NSString * street = [inputDict objectForKey:(id)kABPersonAddressStreetKey];
	NSString * city = [inputDict objectForKey:(id)kABPersonAddressCityKey];
	NSString * region1 = [inputDict objectForKey:(id)kABPersonAddressStateKey];
	NSString * region2 = [inputDict objectForKey:@"Region"];
	NSString * postalCode = [inputDict objectForKey:(id)kABPersonAddressZIPKey];
	NSString * country = [inputDict objectForKey:(id)kABPersonAddressCountryKey];
	NSString * countryCode = [inputDict objectForKey:(id)kABPersonAddressCountryCodeKey];

	NSMutableString * displayAddress = [NSMutableString string];
	if ([street length]>0) {
		NSRange returnKey = [street rangeOfString:@"\n"];
		if (returnKey.location == NSNotFound) {
			[result setObject:street forKey:@"street1"];
		} else {
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
	
	if (region2 != nil) {
		if(city != nil){
			[displayAddress appendFormat:@"\n%@",city];
		}

		[displayAddress appendFormat:@"\n%@",region2];
		if (region1 != nil) {
			[displayAddress appendFormat:@" %@",region1];
		}

		if (postalCode != nil){
			[displayAddress appendFormat:@"\n%@",postalCode];
		}

	} else {
		BOOL addedLine=NO;
		if (city != nil) {
			[displayAddress appendFormat:@"\n%@",city];
			addedLine = YES;
		}

		if (region1 != nil) {
			if (addedLine) {
				[displayAddress appendFormat:@" %@",region1];
			} else {
				[displayAddress appendFormat:@"\n%@",region1];
				addedLine = YES;
			}
		}


		if (postalCode != nil) {
			if (addedLine) {
				[displayAddress appendFormat:@" %@",postalCode];
			} else {
				[displayAddress appendFormat:@"\n%@",postalCode];
			}
		}
		
	}

	NSLocale * ourLocale = [NSLocale currentLocale];
	if(([countryCode length]>0) && ![countryCode isEqual:
			[ourLocale objectForKey:NSLocaleCountryCode]]){
		[displayAddress appendFormat:@"\n%@",country];
	}	

	[result setValue:displayAddress forKey:@"displayAddress"];
	
	return result;
}

#define SAVE_RECORD_IF_STRING(resultRecord, propertyID, savedValue)	\
	if([savedValue respondsToSelector:@selector(stringValue)])savedValue = [savedValue stringValue];	\
	if([savedValue isKindOfClass:[NSString class]]){\
		ABRecordSetValue(resultRecord, propertyID, (CFTypeRef)savedValue, NULL);	\
	} else {	\
		ABRecordRemoveValue(resultRecord, propertyID, NULL);	\
	}


id SetContactPropertiesFromDictionary(ABRecordRef result,NSDictionary * inputDict){
	for (NSString * thisKey in inputDict) {
		id thisValue = [inputDict objectForKey:thisKey];
		if (ContactKeyIsImageDataKey(thisKey)) {
			if([thisValue isKindOfClass:[TitaniumBlobWrapper class]]){
				thisValue = [(TitaniumBlobWrapper *)thisValue dataBlob];
			} else if(![thisValue isKindOfClass:[NSData class]]){
				//Throw error?
				ABPersonRemoveImageData(result, NULL);
				continue;
			}
			ABPersonSetImageData(result, (CFDataRef)thisValue, NULL);
			continue;
		}
		
		ABPropertyID thisPropertyID = PropertyIDForContactKey(thisKey);		
		
		ABPropertyType thisPropertyType = ABPersonGetTypeOfProperty(thisPropertyID);
		
		if (thisPropertyType == kABInvalidPropertyType){
			//Throw error?
			continue;
		}
		
		if (thisPropertyID == kABPersonOrganizationProperty){
			id organization = nil;
			id jobTitle = nil;
			id department = nil;
			if ([thisValue isKindOfClass:[NSArray class]] && ([thisValue count]>0)) {
				NSDictionary * thisValueDict = [thisValue objectForKey:0];
				if ([thisValueDict isKindOfClass:[NSDictionary class]]) {
					NSDictionary * organizationDict = [thisValueDict objectForKey:@"value"];
					if ([organizationDict isKindOfClass:[NSDictionary class]]) {
						organization = [organizationDict objectForKey:@"organization"];
						jobTitle = [organizationDict objectForKey:@"jobTitle"];
						department = [organizationDict objectForKey:@"department"];
					}
				}
			}
			SAVE_RECORD_IF_STRING(result,thisPropertyID,organization);
			SAVE_RECORD_IF_STRING(result,kABPersonJobTitleProperty,jobTitle);
			SAVE_RECORD_IF_STRING(result,kABPersonDepartmentProperty,department);
		}
		
		if(thisValue==[NSNull null]){
			ABRecordRemoveValue(result, thisPropertyID, NULL);
			continue;
		}

		if (thisPropertyID == kABPersonNoteProperty) {
			id note = nil;
			if ([thisValue isKindOfClass:[NSArray class]] && ([thisValue count]>0)) {
				NSDictionary * thisValueDict = [thisValue objectForKey:0];
				if ([thisValueDict isKindOfClass:[NSDictionary class]]) {
					note = [thisValueDict objectForKey:@"value"];
				}
			}
			SAVE_RECORD_IF_STRING(result,thisPropertyID,note);
		}		
		
		if (thisPropertyType & kABMultiValueMask){
			ABMutableMultiValueRef thisMultiValue = ABMultiValueCreateMutable(thisPropertyType);
			for (NSDictionary * thisEntryDictionary in thisValue) {
				if (thisPropertyID == kABPersonAddressProperty) {
					ABMultiValueAddValueAndLabel(thisMultiValue,
							(CFTypeRef)ConvertAddressToNativeFormat([thisEntryDictionary objectForKey:@"value"]),
							(CFStringRef)[thisEntryDictionary objectForKey:@"label"], NULL);
				} else {
					ABMultiValueAddValueAndLabel(thisMultiValue,
												 (CFTypeRef)[thisEntryDictionary objectForKey:@"value"],
												 (CFStringRef)[thisEntryDictionary objectForKey:@"label"], NULL);
				}
			}
			ABRecordSetValue(result, thisPropertyID, thisMultiValue, NULL);
			CFRelease(thisMultiValue);
			continue;
		}
		
		ABRecordSetValue(result, thisPropertyID, (CFTypeRef)thisValue, NULL);
		
	}
	return nil;
}



@interface ContactPickerProxy : TitaniumProxyObject<ABPeoplePickerNavigationControllerDelegate>
{
	NSArray * displayedProperties;
	BOOL animated;
	ABPeoplePickerNavigationController * pickerNavController;
	ContactsModule * owningModule;
}
@property(nonatomic,copy,readwrite)	NSArray * displayedProperties;
@property(nonatomic,assign,readwrite) BOOL animated;
@property(nonatomic,assign,readwrite) ContactsModule * owningModule;
@end

@interface ContactsModule(internalPickerSupport)
- (void) removePicker: (ContactPickerProxy *) doomedPicker;
@end

@implementation ContactPickerProxy
@synthesize displayedProperties, animated, owningModule;

- (id) init
{
	if ((self = [super init])){
		animated = YES;
	}
	return self;
}

- (void) dealloc
{
	[displayedProperties release];
	[super dealloc];
}

- (void) beginPicker;
{
	pickerNavController = [[ABPeoplePickerNavigationController alloc] init];
	[pickerNavController setPeoplePickerDelegate:self];
	[pickerNavController setDisplayedProperties:displayedProperties];
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	TitaniumViewController * ourVC = [theHost titaniumViewControllerForToken:[[self listeningContexts] anyObject]];
	if (ourVC == nil) {
		ourVC = [theHost currentTitaniumViewController];
	}
	[theHost navigationController:[ourVC navigationController] presentModalView:pickerNavController animated:animated];
}

- (void)concludePicking:(NSString *)details;
{
	[[pickerNavController parentViewController] dismissModalViewControllerAnimated:YES];

	NSString * command;
	if(details!=nil){
		command = [NSString stringWithFormat:@"Ti.Contacts._PICKER.%@.success({%@})",[self token],details];
	} else {
		command = [NSString stringWithFormat:@"Ti.Contacts._PICKER.%@.cancel()",[self token]];
	}

	[self sendJavascript:command];
	[owningModule removePicker:self];
}

- (void)peoplePickerNavigationControllerDidCancel:(ABPeoplePickerNavigationController *)peoplePicker;
{
	[self concludePicking:nil];
}

- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person;
{
	if(displayedProperties != nil){
		return YES;
	}

	NSString * eventThings = [NSString stringWithFormat:@"contact:new Ti.Contacts._CONOBJ(%d)",ABRecordGetRecordID(person)];

	[self concludePicking:eventThings];
	return NO;
}

- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController *)peoplePicker shouldContinueAfterSelectingPerson:(ABRecordRef)person property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifier;
{
	NSString * eventThings = [NSString stringWithFormat:@"contact:new Ti.Contacts._CONOBJ(%d),key:'%@',index:%d",
			ABRecordGetRecordID(person),ContactKeyForPropertyID(property),identifier];

	[self concludePicking:eventThings];
	return NO;
}


@end

@implementation ContactsModule

- (id) init
{
	if ((self = [super init])){
		sharedAddressBook = ABAddressBookCreate();
	}
	return self;
}

- (void) dealloc
{
	[contactPickerLookup release];
	CFRelease(sharedAddressBook);
	[super dealloc];
}


- (id) getContactRefs: (NSArray *) args;
{
//Args is unused.
	CFArrayRef ourContactArray = ABAddressBookCopyArrayOfAllPeople(sharedAddressBook);

	NSMutableString * result = [NSMutableString stringWithString:@"["];

	int count = CFArrayGetCount(ourContactArray);
	for (int thisIndex=0; thisIndex<count; thisIndex++) {
		ABRecordRef thisPerson = CFArrayGetValueAtIndex(ourContactArray, thisIndex);
		ABRecordID thisPersonID = ABRecordGetRecordID(thisPerson);
		if (thisIndex==0) {
			[result appendFormat:@"%d",thisPersonID];
		} else {
			[result appendFormat:@",%d",thisPersonID];
		}
	}

	[result appendString:@"]"];

	CFRelease(ourContactArray);
	
	return [TitaniumJSCode codeWithString:result];
}

- (id) getContactProperty: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,2);
	
	NSNumber * referenceObject = [args objectAtIndex:0];
	if(![referenceObject respondsToSelector:@selector(intValue)]){
		return [NSError errorWithDomain:@"Titanium" code:1 userInfo:
				[NSDictionary dictionaryWithObject:@"getContactProperty requires reference ID"
				forKey:NSLocalizedDescriptionKey]];
	}
	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(sharedAddressBook, [referenceObject intValue]);
	
	id result=nil;
	
	if (ourRecord!=NULL)
	{
		NSString * propertyKey = [args objectAtIndex:1];
		if (ContactKeyIsImageDataKey(propertyKey)) {
			if (ABPersonHasImageData(ourRecord)) {
				CFDataRef imageData = ABPersonCopyImageData(ourRecord);
				result = [[TitaniumHost sharedHost] blobForData:(NSData *)imageData];
				CFRelease(imageData);
			}
		} else {
			ABPropertyID ourPropertyID = PropertyIDForContactKey(propertyKey);
			ABPropertyType ourPropertyType = ABPersonGetTypeOfProperty(ourPropertyID);
			CFTypeRef ourProperty = ABRecordCopyValue(ourRecord, ourPropertyID);

			if (ourPropertyType & kABMultiValueMask) {
				if (ourProperty!=NULL) {
					int ourPropertyCount = ABMultiValueGetCount(ourProperty);
					result = [NSMutableArray arrayWithCapacity:ourPropertyCount];
					for (int thisPropertyIndex=0; thisPropertyIndex<ourPropertyCount; thisPropertyIndex++) {
						CFStringRef thisPropertyLabel = ABMultiValueCopyLabelAtIndex(ourProperty, thisPropertyIndex);
						CFTypeRef thisPropertyValue = ABMultiValueCopyValueAtIndex(ourProperty, thisPropertyIndex);
						if(ourPropertyID == kABPersonAddressProperty){
							[result addObject:[NSDictionary dictionaryWithObjectsAndKeys:
											   (NSString *)thisPropertyLabel,@"label",
											   ConvertAddressFromNativeFormat((NSDictionary *)thisPropertyValue),@"value",nil]];
						} else {
							[result addObject:[NSDictionary dictionaryWithObjectsAndKeys:
											   (NSString *)thisPropertyLabel,@"label",(id)thisPropertyValue,@"value",nil]];
						}
						
						CFRelease(thisPropertyValue);
						CFRelease(thisPropertyLabel);
					}
					CFRelease(ourProperty);
				}
			} else if (ourPropertyID == kABPersonNoteProperty) {
				result = [NSArray arrayWithObject:[NSDictionary dictionaryWithObjectsAndKeys:
						@"notes",@"label",(id)ourProperty,@"value",nil]];
				if(ourProperty!=NULL)CFRelease(ourProperty);
			} else if (ourPropertyID == kABPersonOrganizationProperty) { //Organization is organized?
				NSMutableDictionary * organizationDict = [[NSMutableDictionary alloc] initWithCapacity:3];
				if (ourProperty!=NULL) {
					[organizationDict setObject:(id)ourProperty forKey:@"company"];
					CFRelease(ourProperty);
				}
				ourProperty = ABRecordCopyValue(ourRecord, kABPersonDepartmentProperty);
				if (ourProperty!=NULL) {
					[organizationDict setObject:(id)ourProperty forKey:@"department"];
					CFRelease(ourProperty);
				}
				ourProperty = ABRecordCopyValue(ourRecord, kABPersonJobTitleProperty);
				if (ourProperty!=NULL) {
					[organizationDict setObject:(id)ourProperty forKey:@"jobTitle"];
					CFRelease(ourProperty);
				}
				
				result = [NSArray arrayWithObject:[NSDictionary dictionaryWithObjectsAndKeys:
						(id)kABWorkLabel,@"label",(id)organizationDict,@"value",nil]];
				[organizationDict release];
			} else {
				result = [(id)ourProperty autorelease];
			}
		}
	}
	
	return result;
}

- (id) removeContact: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,1);
	
	NSNumber * referenceObject = [args objectAtIndex:0];
	if(![referenceObject respondsToSelector:@selector(intValue)]){
		return [NSError errorWithDomain:@"Titanium" code:1 userInfo:
				[NSDictionary dictionaryWithObject:@"getContactProperty requires reference ID"
											forKey:NSLocalizedDescriptionKey]];
	}
	
	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(sharedAddressBook, [referenceObject intValue]);
	ABAddressBookRemoveRecord(sharedAddressBook, ourRecord, NULL);

	ABAddressBookSave(sharedAddressBook, NULL);
	
	return [NSNumber numberWithBool:YES];
}

- (id) addContact: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,1);
	
	NSDictionary * propertiesDict = [args objectAtIndex:0];
	
	ABRecordRef ourRecord = ABPersonCreate();
	SetContactPropertiesFromDictionary(ourRecord, propertiesDict);
	ABAddressBookAddRecord(sharedAddressBook, ourRecord, NULL);

	ABAddressBookSave(sharedAddressBook, NULL);
	ABRecordID result = ABRecordGetRecordID(ourRecord);

	CFRelease(ourRecord);
	return [NSNumber numberWithInt:result];
}

- (id) saveContact: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,2);
	
	NSNumber * referenceObject = [args objectAtIndex:0];
	if(![referenceObject respondsToSelector:@selector(intValue)]){
		return [NSError errorWithDomain:@"Titanium" code:1 userInfo:
				[NSDictionary dictionaryWithObject:@"getContactProperty requires reference ID"
											forKey:NSLocalizedDescriptionKey]];
	}

	NSDictionary * propertiesDict = [args objectAtIndex:1];

	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(sharedAddressBook, [referenceObject intValue]);
	
	SetContactPropertiesFromDictionary(ourRecord, propertiesDict);

	ABAddressBookSave(sharedAddressBook, NULL);
	
	return nil;
}

- (id) showPicker: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,1);
	NSString * pickerToken = [NSString stringWithFormat:@"PIC%d",nextContactPickerToken++];
	ContactPickerProxy * ourProxy = [[ContactPickerProxy alloc] init];
	[ourProxy setToken:pickerToken];
	[ourProxy setOwningModule:self];

	NSArray * pickerOptions = [args objectAtIndex:0];
	if ([pickerOptions isKindOfClass:[NSArray class]]) {
		NSMutableArray * translatedPickerOptions = [[NSMutableArray alloc] initWithCapacity:[pickerOptions count]];
		for (NSString * thisPropertyKey in pickerOptions) {
			ABPropertyID thisPropertyID = PropertyIDForContactKey(thisPropertyKey);
			if (thisPropertyID >= 0) {
				[translatedPickerOptions addObject:[NSNumber numberWithInt:thisPropertyID]];
			}
		}
		[ourProxy setDisplayedProperties:translatedPickerOptions];
		[translatedPickerOptions release];
	}
	
	if(contactPickerLookup == nil){
		contactPickerLookup = [[NSMutableDictionary alloc] initWithObjectsAndKeys:ourProxy,pickerToken,nil];
	} else {
		[contactPickerLookup setObject:ourProxy forKey:pickerToken];
	}
	[ourProxy performSelectorOnMainThread:@selector(beginPicker) withObject:nil waitUntilDone:NO];
	[ourProxy release];
	return pickerToken;
}

- (void) removePicker: (ContactPickerProxy *) doomedPicker;
{
	[contactPickerLookup removeObjectForKey:[doomedPicker token]];
}



#pragma mark startModule

- (BOOL) startModule
{
//	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(TemplateModule *)invocGen foo];
//	NSInvocation * fooInvoc = [invocGen invocation];
#define CACHING_GETTER(propertyKey)	"function(){var A=this._DELTA." propertyKey ";" \
		"if(A!==undefined)return A;A=this._CACHE." propertyKey ";if((A===undefined)&&(this._REFID)){" \
		"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'" propertyKey "']);" \
		"this._CACHE." propertyKey "=A;}return A;}"

#define MULTIVALUE_GETTER(propertyKey)	"function(){var A=this._DELTA." propertyKey ";" \
		"if(A!==undefined)return A;if(this._REFID){" \
		"A=Ti._TIDO('Contacts','getContactProperty',[this._REFID,'" propertyKey "']);" \
		"this._DELTA." propertyKey "=A;}return A;}"	

	TitaniumJSCode * contactObjectCode = [TitaniumJSCode codeWithString:
			@"function(newRefID){this._REFID=newRefID;this._CACHE={};this._DELTA={};this.equals=function(ob){return ob && ob._REFID && this._REFID===ob._REFID;}; return this;}"];
	[contactObjectCode setEpilogueCode:@"Ti.Contacts._CONOBJ.prototype={"
			"getFirstName:" CACHING_GETTER("firstName") ","
			"setFirstName:function(val){this._DELTA.firstName=val;return val;},"

			"getLastName:" CACHING_GETTER("lastName") ","
			"setLastName:function(val){this._DELTA.lastName=val;return val;},"

			"getMiddleName:" CACHING_GETTER("middleName") ","
			"setMiddleName:function(val){this._DELTA.middleName=val;return val;},"

			"getPrefix:" CACHING_GETTER("prefix") ","
			"setPrefix:function(val){this._DELTA.prefix=val;return val;},"

			"getSuffix:" CACHING_GETTER("suffix") ","
			"setSuffix:function(val){this._DELTA.suffix=val;return val;},"

			"getNickname:" CACHING_GETTER("nickname") ","
			"setNickname:function(val){this._DELTA.nickname=val;return val;},"

			"getPhoneticFirstName:" CACHING_GETTER("phoneticFirstName") ","
			"setPhoneticFirstName:function(val){this._DELTA.phoneticFirstName=val;return val;},"

			"getPhoneticLastName:" CACHING_GETTER("phoneticLastName") ","
			"setPhoneticLastName:function(val){this._DELTA.phoneticLastName=val;return val;},"

			"getPhoneticMiddleName:" CACHING_GETTER("phoneticMiddleName") ","
			"setPhoneticMiddleName:function(val){this._DELTA.phoneticMiddleName=val;return val;},"

			"getOrganization:" MULTIVALUE_GETTER("organization") ","
			"setOrganization:function(val){this._DELTA.organization=val;return val;},"

//			"getJobTitle:" CACHING_GETTER("jobTitle") ","
//			"setJobTitle:function(val){this._DELTA.jobTitle=val;return val;},"
//
//			"getDepartment:" CACHING_GETTER("department") ","
//			"setDepartment:function(val){this._DELTA.department=val;return val;},"

			"getEmail:" MULTIVALUE_GETTER("email") ","
			"setEmail:function(val){this._DELTA.email=val;return val;},"

			"getBirthday:" CACHING_GETTER("birthday") ","
			"setBirthday:function(val){this._DELTA.birthday=val;return val;},"

			"getNote:" MULTIVALUE_GETTER("note") ","
			"setNote:function(val){this._DELTA.note=val;return val;},"

			"getCreationDate:" CACHING_GETTER("creationDate") ","
			"setCreationDate:function(val){this._DELTA.creationDate=val;return val;},"

			"getModificationDate:" CACHING_GETTER("modificationDate") ","
			"setModificationDate:function(val){this._DELTA.modificationDate=val;return val;},"

			"getImageData:" CACHING_GETTER("imageData") ","
			"setImageData:function(val){this._DELTA.imageData=val;return val;},"

			 "getAddress:" MULTIVALUE_GETTER("address") ","
			 "setAddress:function(val){this._DELTA.address=val;return val;},"

			 "getDate:" MULTIVALUE_GETTER("date") ","
			 "setDate:function(val){this._DELTA.date=val;return val;},"

			 "getPhone:" MULTIVALUE_GETTER("phone") ","
			 "setPhone:function(val){this._DELTA.phone=val;return val;},"

			 "getInstantMessenger:" MULTIVALUE_GETTER("instantMessenger") ","
			 "setInstantMessenger:function(val){this._DELTA.instantMessenger=val;return val;},"

			 "getUrl:" MULTIVALUE_GETTER("url") ","
			 "setUrl:function(val){this._DELTA.url=val;return val;},"

			 "getRelatives:" MULTIVALUE_GETTER("relatives") ","
			 "setRelatives:function(val){this._DELTA.relatives=val;return val;},"
			 
			 "getDisplayName:function(){var R=this.getPrefix();"
				 "var a=this.getFirstName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getMiddleName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getLastName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getSuffix();if(a)if(R)R+=' '+a;else R=a;"
				 "return R;},"
			
			 "getDisplayPhoneticName:function(){var R=this.getPrefix();"
				 "var a=this.getFirstPhoneticName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getMiddlePhoneticName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getLastPhoneticName();if(a)if(R)R+=' '+a;else R=a;"
				 "a=this.getSuffix();if(a)if(R)R+=' '+a;else R=a;"
				 "return R;},"
	 
			 "getDisplayLabel:function(){var R=this.getDisplayName();if(R)return R;"
				"try{R=this.getOrganization()[0].value.company;if(R)return R;}catch(E){}"
				"try{R=this.getPhone()[0].value;if(R)return R;}catch(E){}"
				"return 'No Name';},"
		"};"
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","firstName","FirstName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","lastName","LastName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","middleName","MiddleName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","prefix","Prefix")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","suffix","Suffix")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","nickname","Nickname")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","phoneticFirstName","PhoneticFirstName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","phoneticLastName","PhoneticLastName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","phoneticMiddleName","PhoneticMiddleName")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","organization","Organization")
//	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","jobTitle","JobTitle")
//	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","department","Department")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","email","Email")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","birthday","Birthday")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","note","Note")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","creationDate","CreationDate")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","modificationDate","ModificationDate")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","imageData","ImageData")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","address","Address")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","date","Date")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","phone","Phone")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","instantMessenger","InstantMessenger")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","url","Url")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","relatives","Relatives")

	DECLARE_JS_GETTER("Contacts._CONOBJ","displayLabel","DisplayLabel")
	DECLARE_JS_GETTER("Contacts._CONOBJ","displayName","DisplayName")
	DECLARE_JS_GETTER("Contacts._CONOBJ","displayPhoneticName","DisplayPhoneticName")

			 ];

	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			@"street1",@"ADDRESS_STREET_1",
			@"street2",@"ADDRESS_STREET_2",
			@"city",@"ADDRESS_CITY",
			@"region1",@"ADDRESS_STATE",
			@"region1",@"ADDRESS_PROVINCE",
			@"region2",@"ADDRESS_SECONDARY_REGION",
			@"postalCode",@"ADDRESS_ZIP",
			@"postalCode",@"ADDRESS_POSTAL_CODE",
			@"country",@"ADDRESS_COUNTRY",
			@"countryCode",@"ADDRESS_COUNTRY_CODE",
	
	
			contactObjectCode,@"_CONOBJ",			
			[TitaniumJSCode codeWithString:@"{}"],@"_PICKER",
			[TitaniumJSCode codeWithString:@"function(options){var tkn=Ti._TIDO('contacts','showPicker',[options.details]);"
				"Ti.Contacts._PICKER[tkn]=options;}"],@"showContactPicker",
			[TitaniumJSCode codeWithString:@"function(){var refs=Ti._TIDO('contacts','getContactRefs');"
				"var len=refs.length;var res=[];var ob=Ti.Contacts._CONOBJ;for(var i=0;i<len;i++){"
					"res.push(new ob(refs[i]));}return res;}"],@"getAllContacts",
			[TitaniumJSCode codeWithString:@"function(options){var res=new Ti.Contacts._CONOBJ();"
				"for(prop in options){res._DELTA[prop]=options[prop];}return res;}"],@"createContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(contact._REFID && "
				"Ti._TIDO('contacts','removeContact',[contact._REFID])){delete contact._REFID;}"
				"else{throw 'Contact does not exist in the address book.'}}"],@"removeContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(!contact._REFID || contact._REFID==-1)"
				"{var del=contact._DELTA;contact._REFID=Ti._TIDO('contacts','addContact',[del]);"
				"for(prop in del){contact._CACHE[prop]=del[prop]}contact._DELTA={}; return contact;}"
				"else{throw 'Contact already exists in the address book.'}}"],@"addContact",
			[TitaniumJSCode codeWithString:@"function(contact){if(contact._REFID)"
				"{var del=contact._DELTA;Ti._TIDO('contacts','saveContact',[contact._REFID,del]);"
				"for(prop in del){contact._CACHE[prop]=del[prop]}contact._DELTA={};}"
				"else{throw 'Contact must be added to the address book first.';}}"],@"saveContact",			
			nil];
	[[TitaniumHost sharedHost] bindObject:moduleDict toKeyPath:@"Contacts"];
	
	return YES;
}

@end
