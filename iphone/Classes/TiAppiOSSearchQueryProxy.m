/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef IS_XCODE_8
#ifdef USE_TI_APPIOSSEARCHQUERY
#import "TiAppiOSSearchQueryProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import "TiUtils.h"

@implementation TiAppiOSSearchQueryProxy

- (void)dealloc
{
    RELEASE_TO_NIL(query);
    [super dealloc];
}

- (CSSearchQuery*)query
{
    if (query == nil) {
        id queryString = [self valueForKey:@"queryString"];
        id attributes = [self valueForKey:@"attributes"];
        
        ENSURE_TYPE(queryString, NSString);
        ENSURE_TYPE_OR_NIL(attributes, NSArray);
        
        query = [[[CSSearchQuery alloc] initWithQueryString:[TiUtils stringValue:queryString]
                                                attributes:attributes] retain];
        
        [query setFoundItemsHandler:^(NSArray<CSSearchableItem*> *items) {
            if ([self _hasListeners:@"founditems"]) {
                NSMutableArray *result = [NSMutableArray arrayWithCapacity:[query foundItemCount]];
                
                for (CSSearchableItem *item in items) {
                    [result addObject:[[[TiAppiOSSearchableItemProxy alloc] initWithUniqueIdentifier:[item uniqueIdentifier]
                                                                               withDomainIdentifier:[item domainIdentifier ]
                                                                                   withAttributeSet:[item attributeSet]] autorelease]];
                }
                
                [self fireEvent:@"founditems" withObject:@{
                    @"items": result,
                    @"foundItemCount": NUMUINTEGER([query foundItemCount])
                }];                
            }
        }];
        
        [query setCompletionHandler:^(NSError *error) {
           if ([self _hasListeners:@"completed"]) {
                NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{
                    @"success": NUMBOOL(error == nil),
                    @"foundItemCount": NUMUINTEGER([query foundItemCount])
                }];
               
                if (error != nil) {
                    [dict setValue:[error localizedDescription] forKey:@"error"];
                }
                
                [self fireEvent:@"completed" withObject:dict];
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

- (NSNumber*)isCancelled:(id)unused
{
    return NUMBOOL([[self query] isCancelled]);
}

@end
#endif
#endif
