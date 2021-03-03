/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_APPIOSSEARCHQUERY) || defined(USE_TI_APPIOSSEARCHABLEITEM)
#import "TiAppiOSSearchableItemProxy.h"
#import "TiAppiOSSearchableItemAttributeSetProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiAppiOSSearchableItemProxy

- (id)initWithUniqueIdentifier:(NSString *)identifier
          withDomainIdentifier:(NSString *)domainIdentifier
              withAttributeSet:(CSSearchableItemAttributeSet *)attributeSet
{
  if (self = [super init]) {
    _item = [[CSSearchableItem alloc] initWithUniqueIdentifier:identifier
                                              domainIdentifier:domainIdentifier
                                                  attributeSet:attributeSet];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(_item);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.App.iOS.SearchableItem";
}

// Should be unique to your application group.
// REQUIRED since this is the way you will refer to the item to update the index / delete it from the index
// Starts with an UUID for ease of use, but you can replace it with an UID of your own before the item is first indexed if you wish.
- (NSString *)uniqueIdentifier
{
  return _item.uniqueIdentifier;
}

// An optional identifier that represents the "domain" or owner of this item.
// This might be an identifier for a mailbox in an account whose indexed data you may want to remove when the account is deleted.
// In that case the domainIdentifier should be of the form <account-id>.<mailbox-id> where <account-id> and <mailbox-id> should not contains periods.
// Calling deleteSearchableItemsWithDomainIdentifiers with <account-id>.<mailbox-id> will delete all items with that domain identifier.
// Calling deleteSearchableItemsWithDomainIdentifiers with <account-id> will delete all items with <account-id> and any <mailbox-id>.
- (NSString *)domainIdentifier
{
  return _item.domainIdentifier;
}

- (TiAppiOSSearchableItemAttributeSetProxy *)attributeSet
{
  return [[[TiAppiOSSearchableItemAttributeSetProxy alloc] initWithItemAttributeSet:_item.attributeSet] autorelease];
}

// Searchable items have an expiration date or time to live.  By default it's set to 1 month.
- (NSString *)expirationDate
{
  if (_item.expirationDate == nil) {
    return nil;
  }

  return [TiUtils UTCDateForDate:_item.expirationDate];
}

- (void)setExpirationDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setExpirationDate, value);
  _item.expirationDate = [TiUtils dateForUTCDate:value];
}

@end
#endif
