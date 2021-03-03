/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_APPIOSSEARCHABLEINDEX
#import "TiAppiOSSearchableIndexProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiAppiOSSearchableIndexProxy

- (NSString *)apiName
{
  return @"Ti.App.iOS.SearchableIndex";
}

- (id)isSupported:(id)unused
{
  return NUMBOOL([CSSearchableIndex isIndexingAvailable]);
}

- (void)addToDefaultSearchableIndex:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSArray *searchItems = [args objectAtIndex:0];
  ENSURE_TYPE(searchItems, NSArray);

  KrollCallback *callback = [args objectAtIndex:1];
  ENSURE_TYPE(callback, KrollCallback);

  ENSURE_UI_THREAD(addToDefaultSearchableIndex, args);

  //Convert from Proxy to search item
  NSMutableArray *items = [[[NSMutableArray alloc] init] autorelease];
  for (TiAppiOSSearchableItemProxy *item in searchItems) {
    [items addObject:item.item];
  }

  [[CSSearchableIndex defaultSearchableIndex] indexSearchableItems:items
                                                 completionHandler:^(NSError *__nullable error) {
                                                   NSMutableDictionary *event = [[[NSMutableDictionary alloc] init] autorelease];
                                                   [event setObject:NUMBOOL((!error)) forKey:@"success"];

                                                   if (error) {
                                                     [event setObject:[error localizedDescription] forKey:@"error"];
                                                   }

                                                   if (callback) {
                                                     [self _fireEventToListener:@"added"
                                                                     withObject:event
                                                                       listener:callback
                                                                     thisObject:nil];
                                                   }
                                                 }];
}

- (void)deleteAllSearchableItems:(id)arg
{
  ENSURE_ARG_COUNT(arg, 1);
  KrollCallback *callback = [arg objectAtIndex:0];
  ENSURE_TYPE(callback, KrollCallback);

  ENSURE_UI_THREAD(deleteAllSearchableItems, arg);

  [[CSSearchableIndex defaultSearchableIndex] deleteAllSearchableItemsWithCompletionHandler:^(NSError *_Nullable error) {
    NSMutableDictionary *event = [[[NSMutableDictionary alloc] init] autorelease];
    [event setObject:NUMBOOL((!error)) forKey:@"success"];

    if (error) {
      [event setObject:[error localizedDescription] forKey:@"error"];
    }

    if (callback) {
      [self _fireEventToListener:@"removedAll"
                      withObject:event
                        listener:callback
                      thisObject:nil];
    }
  }];
}

- (void)deleteAllSearchableItemByDomainIdenifiers:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSArray *domainIdentifiers = [args objectAtIndex:0];
  ENSURE_TYPE(domainIdentifiers, NSArray);

  KrollCallback *callback = [args objectAtIndex:1];
  ENSURE_TYPE(callback, KrollCallback);

  ENSURE_UI_THREAD(deleteAllSearchableItemByDomainIdenifiers, args);

  [[CSSearchableIndex defaultSearchableIndex] deleteSearchableItemsWithDomainIdentifiers:domainIdentifiers
                                                                       completionHandler:^(NSError *_Nullable error) {
                                                                         NSMutableDictionary *event = [[[NSMutableDictionary alloc] init] autorelease];
                                                                         [event setObject:NUMBOOL((!error)) forKey:@"success"];

                                                                         if (error) {
                                                                           [event setObject:[error localizedDescription] forKey:@"error"];
                                                                         }

                                                                         if (callback) {
                                                                           [self _fireEventToListener:@"removed"
                                                                                           withObject:event
                                                                                             listener:callback
                                                                                           thisObject:nil];
                                                                         }
                                                                       }];
}

- (void)deleteSearchableItemsByIdentifiers:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSArray *identifiers = [args objectAtIndex:0];
  ENSURE_TYPE(identifiers, NSArray);

  KrollCallback *callback = [args objectAtIndex:1];
  ENSURE_TYPE(callback, KrollCallback);

  ENSURE_UI_THREAD(deleteSearchableItemsByIdentifiers, args);

  [[CSSearchableIndex defaultSearchableIndex] deleteSearchableItemsWithIdentifiers:identifiers
                                                                 completionHandler:^(NSError *_Nullable error) {
                                                                   NSMutableDictionary *event = [[[NSMutableDictionary alloc] init] autorelease];
                                                                   [event setObject:NUMBOOL((!error)) forKey:@"success"];

                                                                   if (error) {
                                                                     [event setObject:[error localizedDescription] forKey:@"error"];
                                                                   }

                                                                   if (callback) {
                                                                     [self _fireEventToListener:@"removed"
                                                                                     withObject:event
                                                                                       listener:callback
                                                                                     thisObject:nil];
                                                                   }
                                                                 }];
}

@end
#endif
