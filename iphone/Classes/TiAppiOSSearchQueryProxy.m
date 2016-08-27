/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSSearchQueryProxy.h"
#import "TiAppiOSSearchableItemProxy.h"

@implementation TiAppiOSSearchQueryProxy

- (void)dealloc
{
    RELEASE_TO_NIL(query);
    [super dealloc];
}

- (CSSearchQuery*)query
{
    if (query == nil) {
        NSString *queryString = [self valueForKey:@"queryString"];
        NSArray *attributes = [self valueForKey:@"attributes"];
        
        query = [[CSSearchQuery alloc] initWithQueryString:queryString
                                                attributes:attributes];
        
        [query setFoundItemsHandler:^(NSArray<CSSearchableItem*> *items) {
            if ([self _hasListeners:@"founditems"]) {
                NSMutableArray *result = [NSMutableArray arrayWithCapacity:[query foundItemCount]];
                
                for (CSSearchableItem* item in items) {
                    [result addObject:[[[TiAppiOSSearchableItemProxy alloc] initWithUniqueIdentifier:[item uniqueIdentifier]
                                                                               withDomainIdentifier:[item domainIdentifier ]
                                                                                   withAttributeSet:[item attributeSet]] autorelease]];
                }
                
                [self fireEvent:@"founditems" withObject:@{
                    @"items": result
                }];
                
                RELEASE_TO_NIL(result);
            }
        }];
        
        [query setCompletionHandler:^(NSError *error) {
           if ([self _hasListeners:@"completed"]) {
                NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:NUMBOOL(error == nil), @"success", nil];
                
                if (error != nil) {
                    [dict setValue:[error localizedDescription] forKey:@"error"];
                }
                
                [self fireEvent:@"completed" withObject:dict];
                RELEASE_TO_NIL(dict);
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

- (NSNumber*)isCancelled
{
    return NUMBOOL([[self query] isCancelled]);
}

@end
