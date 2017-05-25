/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
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
static NSDictionary* iOS9multiValueLabels;
static NSDictionary* iOS9propertyKeys;

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
				CFRetain(record);
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

-(id)_initWithPageContext:(id<TiEvaluator>)context person:(ABRecordRef)person_ module:(ContactsModule*)module_
{
	if (self = [super _initWithPageContext:context]) {
		recordId = ABRecordGetRecordID(person_);
		record = CFRetain(person_);
		module = module_;
	}
	return self;
}

-(id)_initWithPageContext:(id<TiEvaluator>)context
				contactId:(CNMutableContact*)person_
				   module:(ContactsModule*)module_ {
	return [self _initWithPageContext:context contactId:person_ module:module_ observer:nil];
}

-(id)_initWithPageContext:(id<TiEvaluator>)context
                contactId:(CNMutableContact*)person_
                   module:(ContactsModule*)module_
                 observer:(id<TiContactsPersonUpdateObserver>) observer_ {
    
	if (self = [super _initWithPageContext:context]) {
		if (![person_ isMemberOfClass:[CNMutableContact class]]) {
			person = [person_ mutableCopy];
		} else {
			person = [person_ retain];
		}
		module = module_;
		[self setObserver:observer_];
		iOS9contactProperties = [[self getiOS9ContactProperties: person_] retain];
	}
	return self;
}

-(void)dealloc
{
    [self setObserver:nil];
    RELEASE_TO_NIL(iOS9contactProperties)
    if (record != NULL) {
        CFRelease(record);
    }
    [super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.Contacts.Person";
}

-(CNMutableContact*)nativePerson
{
    return person;
}

-(NSDictionary*)getiOS9ContactProperties: (CNMutableContact*) contact
{
	if (contact == nil) {
		return nil;
	}
	
	// iOS9 contacts framework by default returns partial contact.
	// For ex: Email is returned nil when phone is selected and vice-versa.
	// So check and add.
	NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
	NSDictionary* supportedProperties = [TiContactsPerson iOS9propertyKeys];
	for (NSString* property in supportedProperties) {
		if ([contact isKeyAvailable:property]) {
			id value = [contact valueForKey:property];
			NSString* key = [supportedProperties objectForKey:property];
			[dict setValue:value forKey:key];
		}
	}
	
	NSDictionary *result = [NSDictionary dictionaryWithDictionary:dict];
	RELEASE_TO_NIL(dict);
	return result;
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

+(NSDictionary*)iOS9propertyKeys
{
	if (iOS9propertyKeys == nil) {
		iOS9propertyKeys = [[NSDictionary alloc] initWithObjectsAndKeys:@"firstName",CNContactGivenNameKey,
			@"lastName",CNContactFamilyNameKey,
			@"middleName",CNContactMiddleNameKey,
			@"prefix",CNContactNamePrefixKey,
			@"suffix",CNContactNameSuffixKey,
			@"nickname",CNContactNicknameKey,
			@"firstPhonetic",CNContactPhoneticGivenNameKey,
			@"lastPhonetic",CNContactPhoneticFamilyNameKey,
			@"middlePhonetic",CNContactPhoneticMiddleNameKey,
			@"organization",CNContactOrganizationNameKey,
			@"jobTitle",CNContactJobTitleKey,
			@"department",CNContactDepartmentNameKey,
			@"email",CNContactEmailAddressesKey,
			@"note",CNContactNoteKey,
			@"birthday",CNContactBirthdayKey,
			@"kind",CNContactTypeKey,
			@"address",CNContactPostalAddressesKey,
			@"phone",CNContactPhoneNumbersKey,
			@"socialProfile",CNContactSocialProfilesKey,
			@"instantMessage",CNContactInstantMessageAddressesKey,
			@"date",CNContactDatesKey,
			@"url",CNContactUrlAddressesKey,
			@"relatedNames",CNContactRelationsKey,
			@"alternateBirthday",CNContactNonGregorianBirthdayKey,
			// Image keys?
			nil];
	}
	return iOS9propertyKeys;
}

+(NSDictionary*)multiValueProperties
{
	if (multiValueProperties == nil) {
		multiValueProperties = 
			[[NSDictionary alloc] initWithObjectsAndKeys:NUMINT	(kABPersonEmailProperty),@"email",
			 NUMINT(kABPersonAddressProperty),@"address",
			 NUMINT(kABPersonPhoneProperty),@"phone",
			 NUMINT(kABPersonSocialProfileProperty),@"socialProfile",
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
			 NUMINT(kABMultiDictionaryPropertyType),NUMINT(kABPersonSocialProfileProperty),
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
			 kABPersonSocialProfileServiceFacebook,@"facebookProfile",// Social Profile Labels
			 kABPersonSocialProfileServiceFlickr,@"flickrProfile",
			 kABPersonSocialProfileServiceGameCenter,@"gameCenterProfile",
			 kABPersonSocialProfileServiceLinkedIn,@"linkedInProfile",
			 kABPersonSocialProfileServiceMyspace,@"myspaceProfile",
			 kABPersonSocialProfileServiceSinaWeibo,@"sinaWeiboProfile",
			 kABPersonSocialProfileServiceTwitter,@"twitterProfile",
			 kABPersonInstantMessageServiceAIM,@"aim", // IM labels
			 kABPersonInstantMessageServiceICQ,@"icq",
			 kABPersonInstantMessageServiceJabber,@"jabber",
			 kABPersonInstantMessageServiceMSN,@"msn",
			 kABPersonInstantMessageServiceYahoo,@"yahoo",
			 kABPersonInstantMessageServiceQQ,@"qq",
			 kABPersonInstantMessageServiceSkype,@"skype",
			 kABPersonInstantMessageServiceGoogleTalk,@"googletalk",
			 kABPersonInstantMessageServiceGaduGadu,@"gadugadu",
			 kABPersonInstantMessageServiceFacebook,@"facebook",
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

+(NSDictionary*)iOS9multiValueLabels
{
	if (iOS9multiValueLabels == nil) {
		iOS9multiValueLabels =
		[[NSDictionary alloc] initWithObjectsAndKeys:@"home",CNLabelHome, // Generic labels
		 @"work",CNLabelWork,
		 @"other",CNLabelOther,
		 @"mobile",CNLabelPhoneNumberMobile, // Phone labels
		 @"pager",CNLabelPhoneNumberPager,
		 @"workFax",CNLabelPhoneNumberWorkFax,
		 @"main",CNLabelPhoneNumberMain,
		 @"iPhone",CNLabelPhoneNumberiPhone,
		 @"homeFax",CNLabelPhoneNumberHomeFax,
		 @"facebookProfile",[CNSocialProfileServiceFacebook lowercaseString],// Social Profile Labels, curiously the string constants in the system is in lower case, so small hack here until iOS9 Beta makes changes here.
		 @"flickrProfile",[CNSocialProfileServiceFlickr lowercaseString],
		 @"gameCenterProfile",[CNSocialProfileServiceGameCenter lowercaseString],
		 @"linkedInProfile",[CNSocialProfileServiceLinkedIn lowercaseString],
		 @"myspaceProfile",[CNSocialProfileServiceMySpace lowercaseString],
		 @"sinaWeiboProfile",[CNSocialProfileServiceSinaWeibo lowercaseString],
		 @"twitterProfile",[CNSocialProfileServiceTwitter lowercaseString],
		 @"yelpProfile",[CNSocialProfileServiceYelp lowercaseString],
		 @"tencentWeiboProfile",[CNSocialProfileServiceTencentWeibo lowercaseString],
		 @"aim",CNInstantMessageServiceAIM, // IM labels
		 @"icq",CNInstantMessageServiceICQ,
		 @"jabber",CNInstantMessageServiceJabber,
		 @"msn",CNInstantMessageServiceMSN,
		 @"yahoo",CNInstantMessageServiceYahoo,
		 @"qq",CNInstantMessageServiceQQ,
		 @"skype",CNInstantMessageServiceSkype,
		 @"googletalk",CNInstantMessageServiceGoogleTalk,
		 @"gadugadu",CNInstantMessageServiceGaduGadu,
		 @"facebook",CNInstantMessageServiceFacebook,
		 @"mother",CNLabelContactRelationMother, // Relation labels
		 @"father",CNLabelContactRelationFather,
		 @"parent",CNLabelContactRelationParent,
		 @"sister",CNLabelContactRelationSister,
		 @"brother",CNLabelContactRelationBrother,
		 @"child",CNLabelContactRelationChild,
		 @"friend",CNLabelContactRelationFriend,
		 @"spouse",CNLabelContactRelationSpouse,
		 @"partner",CNLabelContactRelationPartner,
		 @"manager",CNLabelContactRelationManager,
		 @"assistant",CNLabelContactRelationAssistant,
		 @"anniversary",CNLabelDateAnniversary, // Date label
		 @"homepage",CNLabelURLAddressHomePage, // URL label
		 nil];
	}
	return iOS9multiValueLabels;
}

-(void)updateiOS9ContactProperties
{
    RELEASE_TO_NIL(iOS9contactProperties)
	iOS9contactProperties = nil;
	[self getiOS9ContactProperties:person];
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


-(NSDictionary*)dictionaryFromiOS9MultiValueArray:(NSArray *)property
{
	NSMutableDictionary *multiValueDict = [NSMutableDictionary dictionaryWithCapacity:[property count]];
	for (CNLabeledValue *genericProperty in property) {
		NSString *key = [[TiContactsPerson iOS9multiValueLabels] valueForKey:genericProperty.label];
		if (key == nil) {
			if (genericProperty.label == nil && [genericProperty.value isKindOfClass:[CNPhoneNumber class]]) {
				// For case where phone number is added via phone dialog. This should be nonnull as according to apple docs but quick fix for now til apple fixes it.
				key = @"phone";
			}
			else if (genericProperty.label == nil && [genericProperty.value isKindOfClass:[NSString class]]) {
				// For case where email is added via contact card import. This should be nonnull as according to apple docs but quick fix for now til apple fixes it.
				key = @"email";
			}
			else if (genericProperty.label == nil && [genericProperty.value isKindOfClass:[CNPostalAddress class]]) {
				// For case where address is added via contact card import. This should be nonnull as according to apple docs but quick fix for now til apple fixes it.
				key = @"address";
			}
			else {
				//must be a custom label
				key = [NSString stringWithString:genericProperty.label];
			}
		}
		NSMutableArray *labels = nil;
		if ([multiValueDict objectForKey:key] == nil) {
			labels = [[[NSMutableArray alloc] init] autorelease];
		}
		else {
			labels = [multiValueDict objectForKey:key];
		}
		if ([genericProperty.value isKindOfClass:[NSString class]]) {
			[labels addObject:genericProperty.value];
		}
		if ([genericProperty.value isKindOfClass:[CNPostalAddress class]]) {
			CNPostalAddress *address = genericProperty.value;
			NSDictionary *addressDict = [NSDictionary dictionaryWithObjectsAndKeys:address.street,@"Street",
										 address.city,@"City",
										 address.state,@"State",
										 address.postalCode,@"PostalCode",
										 address.country,@"Country",
										 address.ISOCountryCode,@"CountryCode", nil];
			[labels addObject:addressDict];
		}
		if ([genericProperty.value isKindOfClass:[CNSocialProfile class]]) {
			CNSocialProfile *profile = genericProperty.value;
			NSDictionary *profileDict = [NSDictionary dictionaryWithObjectsAndKeys:profile.service,@"service",
										 profile.urlString,@"url",
										 profile.userIdentifier,@"userIdentifier",
										 profile.username,@"username", nil];
			[labels addObject:profileDict];
		}
		if ([genericProperty.value isKindOfClass:[CNContactRelation class]]) {
			CNContactRelation *relation = genericProperty.value;
			[labels addObject:relation.name];
		}
		if ([genericProperty.value isKindOfClass:[CNInstantMessageAddress class]]) {
			CNInstantMessageAddress *im = genericProperty.value;
			NSDictionary *imDict = [NSDictionary dictionaryWithObjectsAndKeys:im.service,@"service",
									im.username,@"username", nil];
			[labels addObject:imDict];
		}
		if ([genericProperty.value isKindOfClass:[CNPhoneNumber class]]) {
			CNPhoneNumber *phoneNumber = genericProperty.value;
			[labels addObject:phoneNumber.stringValue];
		}
		if ([genericProperty.value isKindOfClass:[NSDateComponents class]]) {
			NSDateComponents *dateComponents = genericProperty.value;
			NSDate *date = [[NSCalendar currentCalendar] dateFromComponents:dateComponents];
			[labels addObject:[TiUtils UTCDateForDate:date]];
		}
		[multiValueDict setObject:labels forKey:key];
	}
	NSDictionary *result = [NSDictionary dictionaryWithDictionary:multiValueDict];
	return result;
}

-(ABMultiValueRef)dictionaryToMultiValue:(NSDictionary*)dict type:(ABPropertyType)type
{
	ABMutableMultiValueRef multiValue = ABMultiValueCreateMutable(type);
	[(id)multiValue autorelease];
	for (NSString* key in [dict allKeys]) {
		NSString* label = [[TiContactsPerson multiValueLabels] valueForKey:key];
		for (id value in [dict objectForKey:key]) {
			if (type == kABMultiDateTimePropertyType) {
				ABMultiValueAddValueAndLabel(multiValue, (CFDateRef)[TiUtils dateForUTCDate:(CFTypeRef)value], (CFStringRef)label, NULL);
			}
			else {
				ABMultiValueAddValueAndLabel(multiValue, (CFTypeRef)value, (CFStringRef)label, NULL);
			}
		}
	}
	
	return multiValue;
}

#pragma mark Property management

-(NSNumber*)recordId
{
    if ([TiUtils isIOS9OrGreater]) {
        DebugLog(@"[WARN] this property is removed for iOS9 and greater.");
        return NULL;
    }
	return NUMINT(recordId);
}

// Only for iOS9
-(NSString*)identifier
{
    if ([TiUtils isIOS9OrGreater]) {
        return person.identifier;
    }
    DebugLog(@"[WARN] this property is only used for iOS9 and greater.");
    return NULL;
}

-(NSString*)fullName
{
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self fullName] retain];}, YES);
		return [result autorelease];
	}
	
	if ([TiUtils isIOS9OrGreater]) {
		// Composite name is the concatenated value of Prefix, Suffix, Organization, First name, Last name
		NSMutableString* compositeName = [[NSMutableString alloc] init];
		if ([person.namePrefix length]) {
			[compositeName appendFormat:@"%@ ", person.namePrefix];
		}
		if ([person.givenName length]) {
			[compositeName appendFormat:@"%@ ", person.givenName];
		}
		if ([person.middleName length]) {
			[compositeName appendFormat:@"%@ ", person.middleName];
		}
		if ([person.familyName length]) {
			[compositeName appendFormat:@"%@ ", person.familyName];
		}
		if ([person.nameSuffix length]) {
			[compositeName appendFormat:@"%@ ", person.nameSuffix];
		}
        
		if ([compositeName length]) {
			// Remove last space
			NSRange range;
			range.length = 1;
			range.location = [compositeName length] - 1;
			[compositeName deleteCharactersInRange:range];
			NSString* nameStr = [NSString stringWithString:compositeName];
			RELEASE_TO_NIL(compositeName)
			return nameStr;
		}
        RELEASE_TO_NIL(compositeName)
		return @"No name";
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
	if ([TiUtils isIOS9OrGreater]) {
		DebugLog(@"[WARN] this method is removed for iOS9 and greater.");
		return;
	}
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

	if ([TiUtils isIOS9OrGreater]) {
		if (person.imageDataAvailable == YES) {
			TiBlob* imageBlob = [[[TiBlob alloc] _initWithPageContext:[self pageContext] andImage:[UIImage imageWithData:person.imageData]] autorelease];
			return imageBlob;
		}
		return nil;
	}
	
	CFDataRef imageData = ABPersonCopyImageData([self record]);
	if (imageData != NULL)
	{
		TiBlob* imageBlob = [[[TiBlob alloc] _initWithPageContext:[self pageContext] andImage:[UIImage imageWithData:(NSData*)imageData]] autorelease];
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
	if ([TiUtils isIOS9OrGreater]) {
		NSDate *saveDate = [TiUtils dateForUTCDate:date];
		unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth |  NSCalendarUnitDay;
		NSCalendar * cal = [NSCalendar currentCalendar];
		person.birthday = [cal components:unitFlags fromDate:saveDate];
		[self checkAndNotifyObserver];
		return;
	}

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

	if ([TiUtils isIOS9OrGreater]) {
		// Birthday property managed seperately
		if ([key isEqualToString:@"birthday"] && [person isKeyAvailable:CNContactBirthdayKey]) {
			NSDate *date = [[NSCalendar currentCalendar] dateFromComponents:person.birthday];
			return [TiUtils UTCDateForDate:date];
		}
		if (property = [iOS9contactProperties valueForKey:key]) {
			id result = [NSNull null];
			if ([property isKindOfClass:[NSString class]]) {
					result = property;
			}
			if ([property isKindOfClass:[NSNumber class]]) {
				if ([property integerValue] == CNContactTypeOrganization) {
					result = module.CONTACTS_KIND_ORGANIZATION;
				}
				else if ([property integerValue] == CNContactTypePerson) {
					result = module.CONTACTS_KIND_PERSON;
				}
			}
			if ([property isKindOfClass:[NSDateComponents class]]) {
				// AlternateBirthday
				if ([key isEqualToString:@"alternateBirthday"]) {
					NSDateComponents *dateComps = (NSDateComponents*)property;
					result = [NSDictionary dictionaryWithObjectsAndKeys: dateComps.calendar.calendarIdentifier,@"calendarIdentifier",NUMLONG(dateComps.era),@"era",NUMLONG(dateComps.year),@"year",NUMLONG(dateComps.month),@"month",NUMLONG(dateComps.day),@"day",NUMBOOL(dateComps.isLeapMonth),@"isLeapMonth", nil];
				}
				else {
					NSDate *date = [[NSCalendar currentCalendar] dateFromComponents:property];
					result = [TiUtils UTCDateForDate:date];
				}
			}
			// Multi-value properties
			if ([property isKindOfClass:[NSArray class]]) {
				result = [self dictionaryFromiOS9MultiValueArray:property];
			}
			return result;
		}
		else {
			id result = [super valueForUndefinedKey:key];
			return result;
		}
	}

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
	if ([TiUtils isIOS9OrGreater]) {
		NSArray *allKeys = [[TiContactsPerson iOS9propertyKeys] allKeysForObject:key];
		// Key is undefined
		if ([allKeys count] != 1) {
			[super setValue:value forUndefinedKey:key];
			return;
		}
		property = [allKeys objectAtIndex:0];

		// For single string properties
		if ([value isKindOfClass:[NSString class]]) {
			[person setValue:value forKey:property];
		}
		
		else if ([key isEqualToString:@"kind"]) {
			ENSURE_TYPE(value, NSNumber)
			if ([module.CONTACTS_KIND_PERSON isEqualToNumber:value]) {
				person.contactType = CNContactTypePerson;
			}
			else if ([module.CONTACTS_KIND_PERSON isEqualToNumber:value]) {
				person.contactType = CNContactTypeOrganization;
			}
		}

		else if ([key isEqualToString:@"alternateBirthday"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSDateComponents *comp = [[[NSDateComponents alloc] init] autorelease];
			comp.era = [TiUtils doubleValue:[value objectForKey:@"era"]];
			comp.day = [TiUtils doubleValue:[value objectForKey:@"day"]];
			comp.month = [TiUtils doubleValue:[value objectForKey:@"month"]];
			comp.year = [TiUtils doubleValue:[value objectForKey:@"year"]];
			comp.calendar = [NSCalendar calendarWithIdentifier:[value objectForKey:@"calendarIdentifier"]];
			person.nonGregorianBirthday = comp;
		}
		
		else if ([key isEqualToString:@"phone"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSString *object in objects) {
					CNPhoneNumber *phoneNumber = [CNPhoneNumber phoneNumberWithStringValue:object];
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:phoneNumber];
					[newObjects addObject:labeledValue];
				}
			}
			[person setPhoneNumbers:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"email"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSString *object in objects) {
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:object];
					[newObjects addObject:labeledValue];
				}
			}
			[person setEmailAddresses:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"url"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSString *object in objects) {
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:object];
					[newObjects addObject:labeledValue];
				}
			}
			[person setUrlAddresses:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"date"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSString *object in objects) {
					NSDate *saveDate = [TiUtils dateForUTCDate:object];
					unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth |  NSCalendarUnitDay;
					NSCalendar * cal = [NSCalendar currentCalendar];
					NSDateComponents *dateComps = [cal components:unitFlags fromDate:saveDate];
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:dateComps];
					[newObjects addObject:labeledValue];
				}
			}
			[person setDates:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"relatedNames"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSString *object in objects) {
					CNContactRelation *relation = [CNContactRelation contactRelationWithName:object];
						CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:relation];
						[newObjects addObject:labeledValue];
				}
			}
			[person setContactRelations:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"address"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSDictionary *dict in objects) {
					CNMutablePostalAddress *address = [[[CNMutablePostalAddress alloc] init] autorelease];
					address.state = [dict objectForKey:@"State"];
					address.city = [dict objectForKey:@"City"];
					address.country = [dict objectForKey:@"Country"];
					address.street = [dict objectForKey:@"Street"];
					address.postalCode = [dict objectForKey:@"PostalCode"];
					address.ISOCountryCode = [dict objectForKey:@"CountryCode"];
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:address];
					[newObjects addObject:labeledValue];
				}
			}
			[person setPostalAddresses:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"instantMessage"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSDictionary *dict in objects) {
					CNInstantMessageAddress *im = [[[CNInstantMessageAddress alloc] initWithUsername:[dict objectForKey:@"username"] service:[dict objectForKey:@"service"]] autorelease];
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:[[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0] value:im];
					[newObjects addObject:labeledValue];
				}
			}
			[person setInstantMessageAddresses:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
        
		else if ([key isEqualToString:@"socialProfile"]) {
			ENSURE_TYPE(value, NSDictionary)
			NSArray *keys = [value allKeys];
			NSMutableArray *newObjects = [[NSMutableArray alloc] init];
			for (NSString *key in keys) {
				NSArray *objects = [value objectForKey:key];
				for (NSDictionary *dict in objects) {
					// URL automatically set
					CNSocialProfile *sp = [[[CNSocialProfile alloc] initWithUrlString:nil username:[dict objectForKey:@"username"] userIdentifier:nil service:[dict objectForKey:@"service"]] autorelease];
					NSString *label = [[[TiContactsPerson iOS9multiValueLabels] allKeysForObject:key] objectAtIndex:0];
					NSString *firstChar = [label substringToIndex:1]; // Small hack here to capitalize first letter for socialProfile
					NSString *newLabel = [[firstChar uppercaseString] stringByAppendingString:[label substringFromIndex:1]];
					CNLabeledValue *labeledValue = [CNLabeledValue labeledValueWithLabel:newLabel value:sp];
					[newObjects addObject:labeledValue];
				}
			}
			[person setSocialProfiles:[NSArray arrayWithArray:newObjects]];
			RELEASE_TO_NIL(newObjects)
		}
		// Why we do this ?
		// In >= iOS9 contacts are immutable as well. So when a change happens we should create an associated CNSaveRequest.
		// By observing on this object the observer can update its CNSaveRequest accordingly.
		[self checkAndNotifyObserver];
		return;
	}

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
    // Alternate birthdays have to be done seperately as it uses NSDict for setting ABRecord instead of MultiValueRef
    else if ([key isEqualToString:@"alternateBirthday"]) {
        ENSURE_TYPE(value, NSDictionary);
            CFErrorRef error;
            if (!ABRecordSetValue([self record], kABPersonAlternateBirthdayProperty, value, &error)) {
                CFStringRef reason = CFErrorCopyDescription(error);
                NSString* str = [NSString stringWithString:(NSString*)reason];
                CFRelease(reason);
                [self throwException:[NSString stringWithFormat:@"Failed to set contact property %@: %@", key, str] subreason:nil location:CODELOCATION];
            }
    }
	// Multi-value property
	else if (property = [[TiContactsPerson multiValueProperties] valueForKey:key]) {
        ENSURE_TYPE(value, NSDictionary);
        ABPropertyID propertyID = [property intValue];
		int type = [[[TiContactsPerson multiValueTypes] objectForKey:property] intValue];
        ABMultiValueRef multiVal = [self dictionaryToMultiValue:value type:type];
        CFErrorRef error;
        if (!ABRecordSetValue([self record], propertyID, multiVal, &error)) {
            CFStringRef reason = CFErrorCopyDescription(error);
            NSString* str = [NSString stringWithString:(NSString*)reason];
            CFRelease(reason);
            [self throwException:[NSString stringWithFormat:@"Failed to set contact property %@: %@", key, str]
					   subreason:nil
						location:CODELOCATION];
        }
    }
	// Something else
	else {
		[super setValue:value forUndefinedKey:key];
	}
}

// For iOS9 deleting contact
#ifndef __clang_analyzer__
-(CNSaveRequest*)getSaveRequestForDeletion
{
	CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
	[saveRequest deleteContact:person];
	// Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/pull/7464/files
	// It will be released in ContactsModule.m line 315 in (void)save
	return saveRequest;
}

-(CNSaveRequest*)getSaveRequestForAddition: (NSString*)containerIdentifier
{
	CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
	[saveRequest addContact:person toContainerWithIdentifier:containerIdentifier];
	// Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/pull/7464/files
	// It will be released in ContactsModule.m line 315 in (void)save
	return saveRequest;
}

-(CNSaveRequest*)getSaveRequestForAddToGroup: (CNMutableGroup*) group
{
	CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
	[saveRequest addMember:person toGroup:group];
	// Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/pull/7464/files
	// It will be released in ContactsGroup.m line 288 in (void)add
	return saveRequest;
}

-(CNSaveRequest*)getSaveRequestForRemoveFromGroup: (CNMutableGroup*) group
{
	CNSaveRequest *saveRequest = [[CNSaveRequest alloc] init];
	[saveRequest removeMember:person fromGroup:group];
	// Do not be tempted to autorelease here. https://github.com/appcelerator/titanium_mobile/pull/7464/files
	// It will be released in ContactsGroup.m line 330 in (void)remove
	return saveRequest;
}
#endif
- (void)checkAndNotifyObserver {
	if ([self observer] && [[self observer] respondsToSelector:@selector(didUpdatePerson:)]) {
		[[self observer] didUpdatePerson:self];
	}
}

@end
#endif
