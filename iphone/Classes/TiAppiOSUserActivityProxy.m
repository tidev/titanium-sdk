/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserActivityProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSUserActivityProxy

#pragma mark Titanium Proxy components

-(NSString*)apiName
{
    return @"Ti.App.iOS.UserActivity";
}

-(id)initWithOptions:(NSDictionary*)props
{
    if (self = [super init]) {
        _supported = [self determineMinRequirements:props];
        if(_supported)
        {
            [self buildInitialActivity:props];
        }
    }
    return self;
}

-(void)dealloc
{
    if(_supported)
    {
        [self clean];
    }
    [super dealloc];
}

#pragma mark internal helpers

-(BOOL)activityTypeValid:(NSString*)activityType
{
    NSArray *supportedActivityTypes = [[NSBundle mainBundle]
                                       objectForInfoDictionaryKey:@"NSUserActivityTypes"];
    
    return[supportedActivityTypes containsObject:activityType];
}

-(BOOL) determineMinRequirements:(NSDictionary *)props
{
    _isValid = NO;
    if([TiUtils isIOS8OrGreater])
    {
        if([props objectForKey:@"activityType"])
        {
            NSArray *supportedActivityTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSUserActivityTypes"];
            
            if(![self activityTypeValid:[TiUtils stringValue:@"activityType" properties:props]])
            {
                NSLog(@"[ERROR] activityType provided is not defined in your projects tiapp.xml file");
                return NO;
            }
            else
            {
                _isValid = YES;
                return YES;
            }
        }
        else
        {
            NSLog(@"[ERROR] activityType property is required on creation");
            return NO;
        }
    }
    
    NSLog(@"[ERROR] %@ requires iOS8 or greater", [self apiName]);
    return NO;
}

-(void) buildInitialActivity:(NSDictionary *)props
{
    NSString* activityType = [TiUtils stringValue:@"activityType" properties:props];
    
    [self instanceMake:activityType];
    
    if([props objectForKey:@"title"])
    {
        [_userActivity setTitle:[TiUtils stringValue:@"title" properties:props]];
    }
    
    if([props objectForKey:@"userInfo"])
    {
        [_userActivity addUserInfoEntriesFromDictionary:[props objectForKey:@"userInfo"]];
    }
    
    if([props objectForKey:@"webpageURL"])
    {
        [_userActivity setWebpageURL:[NSURL URLWithString:[[TiUtils stringValue:@"webpageURL" properties:props] stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]]];
    }

    if([props objectForKey:@"needsSave"])
    {
        [_userActivity setNeedsSave:[TiUtils boolValue:@"needsSave" properties:props]];
    }
    
    if([TiUtils isIOS9OrGreater])
    {
        if([props objectForKey:@"eligibleForPublicIndexing"])
        {
            [_userActivity setEligibleForPublicIndexing:[TiUtils boolValue:@"eligibleForPublicIndexing" properties:props]];
        }
        
        if([props objectForKey:@"eligibleForSearch"])
        {
            [_userActivity setEligibleForSearch:[TiUtils boolValue:@"eligibleForSearch" properties:props]];
        }
        
        if([props objectForKey:@"eligibleForHandoff"])
        {
            [_userActivity setEligibleForHandoff:[TiUtils boolValue:@"eligibleForHandoff" properties:props]];
        }
        
        if([props objectForKey:@"expirationDate"])
        {
            [_userActivity setExpirationDate:[TiUtils dateForUTCDate:
                                              [TiUtils stringValue:@"expirationDate" properties:props]]];
        }
    }
    
    _userActivity.delegate = self;
}

-(NSDictionary*)copyActivity
{
    NSMutableDictionary *dict = [[NSMutableDictionary
                                 dictionaryWithObjectsAndKeys:[_userActivity activityType],@"activityType",
                                 nil] autorelease];
    
    if([_userActivity title] !=nil){
        [dict setObject:[_userActivity title] forKey:@"title"];
    }
    
    if([_userActivity webpageURL] !=nil){
        [dict setObject:[[_userActivity webpageURL] absoluteString] forKey:@"webpageURL"];
    }
    
    if([_userActivity userInfo] !=nil){
        [dict setObject:[_userActivity userInfo] forKey:@"userInfo"];
    }
    
    return dict;
}

#pragma mark Properties used for housekeeping

-(void)clean
{
    if(_userActivity !=nil)
    {
        _userActivity.delegate = nil;
        RELEASE_TO_NIL(_userActivity);
    }
}

-(void)instanceMake:(NSString*)activityType
{
    if(_userActivity !=nil)
    {
        [_userActivity invalidate];
    }
    
    [self clean];
    
    _userActivity = [[NSUserActivity alloc]
                     initWithActivityType:activityType];
    _userActivity.delegate = self;

}

-(NSNumber*)isValid
{
    return NUMBOOL(_isValid);
}

-(NSNumber*)supported
{
    return NUMBOOL(_supported);
}

#pragma mark Delegate methods used to raise events

/* The user activity will be saved (to be continued or persisted). The receiver should update the activity with current activity state.
 */
- (void)userActivityWillSave:(NSUserActivity *)userActivity
{
    if([self _hasListeners:@"useractivitywillsave"])
    {
        [self fireEvent:@"useractivitywillsave" withObject:[self copyActivity]];
    }
}

/* The user activity was continued on another device.
 */
- (void)userActivityWasContinued:(NSUserActivity *)userActivity
{
    if([self _hasListeners:@"useractivitywascontinued"])
    {
        [self fireEvent:@"useractivitywascontinued" withObject:[self copyActivity]];
    }
}

#pragma mark iOS 8 UserActivity Methods

-(NSString*)activityType
{
    return [_userActivity activityType];
}

-(void)setActivityType:(NSString*)value
{
    ENSURE_UI_THREAD(setActivityType,value);
    ENSURE_TYPE(value, NSString);
    
    if(![self activityTypeValid:value])
    {
        NSLog(@"[ERROR] activityType provided is not defined in your projects tiapp.xml file");
        return;
    }
    
    if(_userActivity.activityType != value)
    {
        [self instanceMake:value];

    }
}

-(NSString*)title
{
    return [_userActivity title];
}

-(void)setTitle:(NSString*)value
{
    ENSURE_UI_THREAD(setTitle,value);
    [_userActivity setTitle:value];
}

-(NSDictionary*)userInfo
{
    return [_userActivity userInfo];
}

-(void)setUserInfo:(NSDictionary*)info
{
    ENSURE_UI_THREAD(setUserInfo,info);
    [_userActivity setUserInfo:info];
}

-(NSString*)webpageURL
{
    return [[_userActivity webpageURL] absoluteString];
}

-(void)setWebpageURL:(NSString*)value
{
    ENSURE_UI_THREAD(setWebpageURL,value);
    ENSURE_TYPE(value, NSString);

    [_userActivity setWebpageURL:
     [NSURL URLWithString:[value stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]]];
}

-(NSNumber*)needsSave
{
    return NUMBOOL([_userActivity needsSave]);
}

-(void)setNeedsSave:(NSNumber*)value
{
    ENSURE_UI_THREAD(setNeedsSave,value);
    [_userActivity setNeedsSave:[TiUtils boolValue:value]];
}

-(void)becomeCurrent:(id)unused
{
    ENSURE_UI_THREAD(becomeCurrent,unused);
    [_userActivity becomeCurrent];
}

-(void)invalidate:(id)unused
{
    ENSURE_UI_THREAD(invalidate,unused);
    [_userActivity invalidate];
}

#pragma mark iOS 9 UserActivity Methods

-(NSNumber*)eligibleForPublicIndexing
{
    if(![TiUtils isIOS9OrGreater])
    {
        return NUMBOOL(NO);
    }
 
    return NUMBOOL(_userActivity.eligibleForPublicIndexing);
}

-(void)setEligibleForPublicIndexing:(NSNumber*)value
{
    ENSURE_UI_THREAD(setEligibleForPublicIndexing,value);
    if(![TiUtils isIOS9OrGreater])
    {
        return;
    }
    [_userActivity setEligibleForPublicIndexing:[TiUtils boolValue:value]];
}

-(NSNumber*)eligibleForSearch
{
    if(![TiUtils isIOS9OrGreater])
    {
        return NUMBOOL(NO);
    }
    
    return NUMBOOL(_userActivity.eligibleForSearch);
}

-(void)setEligibleForSearch:(NSNumber*)value
{
    ENSURE_UI_THREAD(setEligibleForSearch,value);
    if(![TiUtils isIOS9OrGreater])
    {
        return;
    }
    [_userActivity setEligibleForSearch:[TiUtils boolValue:value]];
}

-(NSNumber*)eligibleForHandoff
{
    if(![TiUtils isIOS9OrGreater])
    {
        return NUMBOOL(NO);
    }
    return NUMBOOL(_userActivity.eligibleForHandoff);
}

-(void)setEligibleForHandoff:(NSNumber*)value
{
    ENSURE_UI_THREAD(setEligibleForHandoff,value);
    if(![TiUtils isIOS9OrGreater])
    {
        return;
    }
    [_userActivity setEligibleForHandoff:[TiUtils boolValue:value]];
}

-(NSString*)expirationDate
{
    if(![TiUtils isIOS9OrGreater] || _userActivity.expirationDate == nil)
    {
        return nil;
    }
    
    return [TiUtils UTCDateForDate:_userActivity.expirationDate];
}

-(void)setExpirationDate:(NSString*)UTCDateFormat
{
    ENSURE_UI_THREAD(setExpirationDate,UTCDateFormat);
    if(![TiUtils isIOS9OrGreater])
    {
        return;
    }
    
    [_userActivity setExpirationDate:[TiUtils dateForUTCDate:UTCDateFormat]];
}

-(void)resignCurrent:(id)unused
{
    ENSURE_UI_THREAD(resignCurrent,unused);
    if(![TiUtils isIOS9OrGreater])
    {
        return;
    }
    [_userActivity resignCurrent];
}

@end

#endif