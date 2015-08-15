/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSSearchableIndexProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS
@implementation TiAppiOSSearchableIndexProxy

-(NSString*)apiName
{
    return @"Ti.App.iOS.SearchableIndex";
}

-(id)isSupported
{
    return NUMBOOL([CSSearchableIndex isIndexingAvailable]);
}

-(void)AddDefaultSearchableIndex:(id)args
{
    ENSURE_ARG_COUNT(args,2);
    TiAppiOSSearchableItemProxy *searchItem = [args objectAtIndex:0];
    ENSURE_TYPE(searchItem,TiAppiOSSearchableItemProxy);
    
    KrollCallback *callback = [args objectAtIndex:1];
    ENSURE_TYPE(callback,KrollCallback);
    
    ENSURE_UI_THREAD(AddDefaultSearchableIndex,args);
    
    [[CSSearchableIndex defaultSearchableIndex] indexSearchableItems:@[searchItem.item] completionHandler: ^(NSError * __nullable error) {
        if(error){
            NSDictionary *eventOk = [NSDictionary dictionaryWithObjectsAndKeys:
                                     NUMBOOL(YES),@"success",
                                     nil];
            [self _fireEventToListener:@"completed"
                            withObject:eventOk listener:callback thisObject:nil];
        }else{
            if (callback){
                NSDictionary* eventErr = [NSDictionary dictionaryWithObjectsAndKeys:
                                          [error localizedDescription],@"error",
                                          NUMBOOL(NO),@"success",nil];
                
                [self _fireEventToListener:@"completed"
                                withObject:eventErr listener:callback thisObject:nil];
            }
        }

    }];
}

-(void)deleteAllSearchableItems:(id)arg
{
    ENSURE_ARG_COUNT(arg,1);
    KrollCallback *callback = [arg objectAtIndex:0];
    ENSURE_TYPE(callback,KrollCallback);
    
    ENSURE_UI_THREAD(deleteAllSearchableItems,arg);
    
    [[CSSearchableIndex defaultSearchableIndex] deleteAllSearchableItemsWithCompletionHandler:^(NSError * _Nullable error) {
        if(error){
            NSDictionary *eventOk = [NSDictionary dictionaryWithObjectsAndKeys:
                                     NUMBOOL(YES),@"success",
                                     nil];
            [self _fireEventToListener:@"completed"
                            withObject:eventOk listener:callback thisObject:nil];
        }else{
            if (callback){
                NSDictionary* eventErr = [NSDictionary dictionaryWithObjectsAndKeys:
                                          [error localizedDescription],@"error",
                                          NUMBOOL(NO),@"success",nil];
                
                [self _fireEventToListener:@"completed"
                                withObject:eventErr listener:callback thisObject:nil];
            }
        }
    }];
    
}

-(void)deleteAllSearchableItemByDomainIdenifiers:(id)args
{
    ENSURE_ARG_COUNT(args,2);
    NSArray * domainIdentifiers = [args objectAtIndex:0];
    ENSURE_TYPE(domainIdentifiers,NSArray);
    
    KrollCallback *callback = [args objectAtIndex:1];
    ENSURE_TYPE(callback,KrollCallback);
    
    ENSURE_UI_THREAD(deleteAllSearchableItemByDomainIdenifiers,args);
    
    [[CSSearchableIndex defaultSearchableIndex] deleteSearchableItemsWithDomainIdentifiers:domainIdentifiers completionHandler:^(NSError * _Nullable error) {
        if(error){
            NSDictionary *eventOk = [NSDictionary dictionaryWithObjectsAndKeys:
                                     NUMBOOL(YES),@"success",
                                     domainIdentifiers,@"domainIdentifiers",
                                     nil];
            [self _fireEventToListener:@"completed"
                            withObject:eventOk listener:callback thisObject:nil];
        }else{
            if (callback){
                NSDictionary* eventErr = [NSDictionary dictionaryWithObjectsAndKeys:
                                          [error localizedDescription],@"error",
                                          domainIdentifiers,@"domainIdentifiers",
                                          NUMBOOL(NO),@"success",nil];
                
                [self _fireEventToListener:@"completed"
                                withObject:eventErr listener:callback thisObject:nil];
            }
        }
    }];
        
}

-(void)deleteSearchableItemsWithIdentifiers:(id)args
{
    ENSURE_ARG_COUNT(args,2);
    NSArray * identifiers = [args objectAtIndex:0];
    ENSURE_TYPE(identifiers,NSArray);
    
    KrollCallback *callback = [args objectAtIndex:1];
    ENSURE_TYPE(callback,KrollCallback);

    ENSURE_UI_THREAD(deleteSearchableItemsWithIdentifiers,args);
    
    [[CSSearchableIndex defaultSearchableIndex] deleteSearchableItemsWithIdentifiers:identifiers completionHandler:^(NSError * _Nullable error) {
        if(error){
            NSDictionary *eventOk = [NSDictionary dictionaryWithObjectsAndKeys:
                                     NUMBOOL(YES),@"success",
                                     identifiers,@"identifiers",
                                     nil];
            [self _fireEventToListener:@"completed"
                            withObject:eventOk listener:callback thisObject:nil];
        }else{
            if (callback){
                NSDictionary* eventErr = [NSDictionary dictionaryWithObjectsAndKeys:
                                          identifiers,@"identifiers",
                                          [error localizedDescription],@"error",
                                          NUMBOOL(NO),@"success",nil];
                
                [self _fireEventToListener:@"completed"
                                withObject:eventErr listener:callback thisObject:nil];
            }
        }
    }];
}

@end
#endif