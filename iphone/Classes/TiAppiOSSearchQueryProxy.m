/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOSSEARCHQUERY
#import "TiAppiOSSearchQueryProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiAppiOSSearchQueryProxy

- (void)dealloc
{
  RELEASE_TO_NIL(queryString);
  RELEASE_TO_NIL(attributes);
  RELEASE_TO_NIL(query);

  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.App.iOS.SearchQuery";
}

- (id)_initWithPageContext:(id<TiEvaluator>)context andArguments:(NSDictionary *)args
{
  ENSURE_TYPE([args objectForKey:@"queryString"], NSString);
  ENSURE_TYPE([args objectForKey:@"attributes"], NSArray);
  if (self = [super _initWithPageContext:context]) {
    queryString = [[args objectForKey:@"queryString"] retain];
    attributes = [[args objectForKey:@"attributes"] retain];
  }

  return self;
}

- (CSSearchQuery *)query
{
  if (query == nil) {

    query = [[[CSSearchQuery alloc] initWithQueryString:queryString
                                             attributes:attributes] retain];

    [query setFoundItemsHandler:^(NSArray<CSSearchableItem *> *items) {
      if ([self _hasListeners:@"founditems"]) {
        NSMutableArray *result = [NSMutableArray array];

        for (CSSearchableItem *item in items) {
          [result addObject:[[[TiAppiOSSearchableItemProxy alloc] initWithUniqueIdentifier:[item uniqueIdentifier]
                                                                      withDomainIdentifier:[item domainIdentifier]
                                                                          withAttributeSet:[item attributeSet]] autorelease]];
        }

        [self fireEvent:@"founditems"
             withObject:@{
               @"items" : result,
               @"foundItemCount" : NUMUINTEGER([query foundItemCount])
             }];
      }
    }];

    [query setCompletionHandler:^(NSError *error) {
      if ([self _hasListeners:@"completed"]) {
        NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{
          @"success" : NUMBOOL(error == nil),
          @"foundItemCount" : NUMUINTEGER([query foundItemCount])
        }];

        if (error != nil) {
          [dict setValue:[error localizedDescription] forKey:@"error"];
        }

        TiThreadPerformOnMainThread(^{
          [self fireEvent:@"completed" withObject:dict];
        },
            NO);
      }
    }];
  }

  return query;
}

- (void)start:(id)unused
{
  [[self query] start];
}

- (void)cancel:(id)unused
{
  [[self query] cancel];
}

- (NSNumber *)isCancelled:(id)unused
{
  return NUMBOOL([[self query] isCancelled]);
}

@end

#endif
