/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CONTACTS

#import <AddressBook/AddressBook.h>
#import <Contacts/Contacts.h>
@class ContactsModule;

@interface TiContactsPerson : TiProxy {
@private
	ABRecordRef record;
	ABRecordID recordId;
    CNMutableContact* person;
	ContactsModule* module;
    NSString* identifier;
	NSDictionary* iOS9contactProperties;
}

@property(readonly,nonatomic) NSNumber* recordId;
@property(readonly,nonatomic) ABRecordRef record;
@property(readonly,nonatomic) NSString* identifier;

+(NSDictionary*)contactProperties;
+(NSDictionary*)multiValueProperties;
+(NSDictionary*)multiValueLabels;
+(NSDictionary*)iOS9multiValueLabels;
+(NSDictionary*)iOS9propertyKeys;

-(id)_initWithPageContext:(id<TiEvaluator>)context recordId:(ABRecordID)id_ module:(ContactsModule*)module_;
-(id)_initWithPageContext:(id<TiEvaluator>)context contactId:(CNMutableContact*)person_ module:(ContactsModule*)module_;
-(id)valueForUndefinedKey:(NSString *)key;
-(CNSaveRequest*)getSaveRequestForDeletion;
-(CNSaveRequest*)getSaveRequestForAddition:(NSString*)containerIdentifier;
-(CNSaveRequest*)getSaveRequestForAddToGroup: (CNMutableGroup*) group;
-(CNSaveRequest*)getSaveRequestForRemoveFromGroup: (CNMutableGroup*) group;
-(NSString*)fullName;
-(void)updateiOS9ContactProperties;
@end

#endif
