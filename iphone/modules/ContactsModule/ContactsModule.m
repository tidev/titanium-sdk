/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ContactsModule.h"

#import <AddressBook/AddressBook.h>
#import <AddressBookUI/AddressBookUI.h>
#import "TitaniumBlobWrapper.h"
#import "TitaniumViewController.h"

BOOL ContactKeyIsImageDataKey(NSString * contactKey){
	return [@"imageData" isEqual:contactKey];
}

NSDictionary * PropertyIDDictionary = nil;

void EnsurePropertyIDDictionary(){
	if (PropertyIDDictionary != nil) return;
	ABAddressBookRef ourAddyBook = ABAddressBookCreate();	//This is necessary to jar the constants to be nonzero.
	CFRelease(ourAddyBook);
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


id SetContactPropertiesFromDictionary(ABRecordRef result,NSDictionary * inputDict){
	for (NSString * thisKey in inputDict) {
		id thisValue = [inputDict objectForKey:thisKey];
		if (ContactKeyIsImageDataKey(thisKey)) {
			if([thisValue isKindOfClass:[TitaniumBlobWrapper class]]){
				thisValue = [(TitaniumBlobWrapper *)thisValue dataBlob];
			} else if(![thisValue isKindOfClass:[NSData class]]){
				//Throw error?
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
		
		if (thisPropertyType & kABMultiValueMask){
			ABMutableMultiValueRef thisMultiValue = ABMultiValueCreateMutable(thisPropertyType);
			for (NSDictionary * thisEntryDictionary in thisValue) {
				ABMultiValueAddValueAndLabel(thisMultiValue,
						(CFTypeRef)[thisEntryDictionary objectForKey:@"value"],
						(CFStringRef)[thisEntryDictionary objectForKey:@"label"], NULL);
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
	TitaniumViewController * ourVC = [theHost titaniumViewControllerForToken:[self parentPageToken]];
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

	[[TitaniumHost sharedHost] sendJavascript:command toPageWithToken:[self parentPageToken]];
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

- (id) getContactRefs: (NSArray *) args;
{
//Args is unused.
	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	CFArrayRef ourContactArray = ABAddressBookCopyArrayOfAllPeople(ourAddyBook);

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
	CFRelease(ourAddyBook);
	
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
	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(ourAddyBook, [referenceObject intValue]);
	
	id result=nil;
	
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
			int ourPropertyCount = ABMultiValueGetCount(ourProperty);
			result = [NSMutableArray arrayWithCapacity:ourPropertyCount];
			for (int thisPropertyIndex=0; thisPropertyIndex<ourPropertyCount; thisPropertyIndex++) {
				CFStringRef thisPropertyLabel = ABMultiValueCopyLabelAtIndex(ourProperty, thisPropertyIndex);
				CFTypeRef thisPropertyValue = ABMultiValueCopyValueAtIndex(ourProperty, thisPropertyIndex);
				[result addObject:[NSDictionary dictionaryWithObjectsAndKeys:
						(NSString *)thisPropertyLabel,@"label",(id)thisPropertyValue,@"value",nil]];
				CFRelease(thisPropertyValue);
				CFRelease(thisPropertyLabel);
			}
			CFRelease(ourProperty);
		} else {
			result = [(id)ourProperty autorelease];
		}
	}
	
	CFRelease(ourAddyBook);
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
	
	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(ourAddyBook, [referenceObject intValue]);
	ABAddressBookRemoveRecord(ourAddyBook, ourRecord, NULL);

	ABAddressBookSave(ourAddyBook, NULL);
	CFRelease(ourAddyBook);
	
	return nil;
}

- (id) addContact: (NSArray *) args;
{
	ASSERT_ARRAY_COUNT(args,1);
	
	NSDictionary * propertiesDict = [args objectAtIndex:0];
	
	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	ABRecordRef ourRecord = ABPersonCreate();
	SetContactPropertiesFromDictionary(ourRecord, propertiesDict);
	ABAddressBookAddRecord(ourAddyBook, ourRecord, NULL);

	ABRecordID result = ABRecordGetRecordID(ourRecord);

	ABAddressBookSave(ourAddyBook, NULL);
	CFRelease(ourRecord);
	CFRelease(ourAddyBook);
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

	ABAddressBookRef ourAddyBook = ABAddressBookCreate();
	ABRecordRef ourRecord = ABAddressBookGetPersonWithRecordID(ourAddyBook, [referenceObject intValue]);
	
	SetContactPropertiesFromDictionary(ourRecord, propertiesDict);

	ABAddressBookSave(ourAddyBook, NULL);
	CFRelease(ourAddyBook);	
	
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
			@"function(newRefID){this._REFID=newRefID;this._CACHE={};this._DELTA={};return this;}"];
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

			"getOrganization:" CACHING_GETTER("organization") ","
			"setOrganization:function(val){this._DELTA.organization=val;return val;},"

			"getJobTitle:" CACHING_GETTER("jobTitle") ","
			"setJobTitle:function(val){this._DELTA.jobTitle=val;return val;},"

			"getDepartment:" CACHING_GETTER("department") ","
			"setDepartment:function(val){this._DELTA.department=val;return val;},"

			"getEmail:" MULTIVALUE_GETTER("email") ","
			"setEmail:function(val){this._DELTA.email=val;return val;},"

			"getBirthday:" CACHING_GETTER("birthday") ","
			"setBirthday:function(val){this._DELTA.birthday=val;return val;},"

			"getNote:" CACHING_GETTER("note") ","
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
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","jobTitle","JobTitle")
	DECLARE_JS_ACCESSORS("Contacts._CONOBJ","department","Department")
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
			 ];

	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
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
			[TitaniumJSCode codeWithString:@"function(contact){if(!contact._REFID)"
				"{var del=contact._DELTA;contact._REFID=Ti._TIDO('contacts','addContact',[del]);"
				"for(prop in del){contact._CACHE[prop]=del[prop]}contact._DELTA={};}"
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
