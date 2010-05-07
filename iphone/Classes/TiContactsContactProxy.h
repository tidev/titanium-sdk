/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CONTACTS

#import <AddressBook/AddressBook.h>

@class ContactsModule;

@interface TiContactsContactProxy : TiProxy {
@private
	ContactsModule *delegate;
	ABRecordRef record;
	ABRecordID recordId;
	BOOL newRecord;
}

-(id)initWithPageContext:(id<TiEvaluator>)context contact:(ABRecordRef)contact newRecord:(BOOL)newRecord_;
-(id)initWithPageContext:(id<TiEvaluator>)context record:(ABRecordID)record;

@property(nonatomic,readwrite,assign) ContactsModule* delegate;
@property(nonatomic,readwrite,getter=isNewRecord) BOOL newRecord;

-(id)save:(id)args;
-(id)remove:(id)args;
-(void)updateFromDict:(NSDictionary*)dict;

-(ABRecordRef)record;
+(ABPropertyID)propertyForKey:(id)key;
+(NSString*)stringForPropertyId:(ABPropertyID)propertyId;



@end

#endif