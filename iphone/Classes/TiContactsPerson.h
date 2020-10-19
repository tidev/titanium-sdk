/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_CONTACTS)

#import <Contacts/Contacts.h>
#import <TitaniumKit/TiProxy.h>

@class TiContactsPerson, ContactsModule;

@protocol TiContactsPersonUpdateObserver <NSObject>

@optional
- (void)didUpdatePerson:(TiContactsPerson *)person;
@end

@interface TiContactsPerson : TiProxy {
  @private
  CNMutableContact *person;
  ContactsModule *module;
  NSDictionary *iOS9contactProperties;
}

@property (readonly, nonatomic) NSNumber *recordId;

@property (readonly, nonatomic) NSString *identifier;
@property (assign, nonatomic) id<TiContactsPersonUpdateObserver> observer;

+ (NSDictionary *)iOS9multiValueLabels;
+ (NSDictionary *)iOS9propertyKeys;
- (id)_initWithPageContext:(id<TiEvaluator>)context
                 contactId:(CNMutableContact *)person_
                    module:(ContactsModule *)module_;
- (id)_initWithPageContext:(id<TiEvaluator>)context
                 contactId:(CNMutableContact *)person_
                    module:(ContactsModule *)module_
                  observer:(id<TiContactsPersonUpdateObserver>)observer_;
- (CNSaveRequest *)getSaveRequestForDeletion;
- (CNSaveRequest *)getSaveRequestForAddition:(NSString *)containerIdentifier;
- (CNSaveRequest *)getSaveRequestForAddToGroup:(CNMutableGroup *)group;
- (CNSaveRequest *)getSaveRequestForRemoveFromGroup:(CNMutableGroup *)group;
- (void)updateiOS9ContactProperties;
- (CNMutableContact *)nativePerson;
- (id)valueForUndefinedKey:(NSString *)key;
- (NSString *)fullName;

@end

#endif
