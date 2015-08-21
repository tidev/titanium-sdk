/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CONTACTS

#import <AddressBook/AddressBook.h>
#if IS_XCODE_7
#import <Contacts/Contacts.h>
#endif
@class ContactsModule;

@interface TiContactsPerson : TiProxy {
@private
	ABRecordRef record;
	ABRecordID recordId;
#if IS_XCODE_7
    CNMutableContact* person;
#endif
	ContactsModule* module;
	NSDictionary* iOS9contactProperties;
}

@property(readonly,nonatomic) NSNumber* recordId;
@property(readonly,nonatomic) ABRecordRef record;

+(NSDictionary*)contactProperties;
+(NSDictionary*)multiValueProperties;
+(NSDictionary*)multiValueLabels;

-(id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule*)module_;
#if IS_XCODE_7
@property(readonly,nonatomic) NSString* identifier;
+(NSDictionary*)iOS9multiValueLabels;
+(NSDictionary*)iOS9propertyKeys;
-(id)_initWithPageContext:(id<TiEvaluator>)context contactId:(CNMutableContact*)person_ module:(ContactsModule*)module_;
-(CNSaveRequest*)getSaveRequestForDeletion;
-(CNSaveRequest*)getSaveRequestForAddition:(NSString*)containerIdentifier;
-(CNSaveRequest*)getSaveRequestForAddToGroup: (CNMutableGroup*) group;
-(CNSaveRequest*)getSaveRequestForRemoveFromGroup: (CNMutableGroup*) group;
-(void)updateiOS9ContactProperties;
#endif
-(id)valueForUndefinedKey:(NSString *)key;
-(NSString*)fullName;
@end

#endif
