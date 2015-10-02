/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if IS_XCODE_7
#ifdef USE_TI_UIIOSAPPLICATIONSHORTCUTS
#import "TiUIiOSApplicationShortcutsProxy.h"
#import "TiUtils.h"
@implementation TiUIiOSApplicationShortcutsProxy

-(NSString*)apiName
{
    return @"Ti.Ui.iOS.ApplicationShortcuts";
}

-(NSDictionary*) shortcutItemToDictionary:(UIApplicationShortcutItem*) item
{
    NSMutableDictionary *dict = [NSMutableDictionary
                                  dictionaryWithObjectsAndKeys:item.type,@"type",
                                 nil];
    
    if (item.localizedTitle != nil) {
        [dict setObject:item.localizedTitle forKey:@"title" ];
    }
    
    if (item.localizedSubtitle != nil) {
        [dict setObject:item.localizedSubtitle forKey:@"subtitle" ];
    }
    
    if (item.userInfo != nil) {
        [dict setObject:item.userInfo forKey:@"userInfo"];
    }
    
    if (item.userInfo != nil) {
        [dict setObject:item.userInfo forKey:@"userInfo"];
    }
    return dict;
}

-(NSArray*)listDynamicShortcuts:(id)unused
{
    NSMutableArray *shortcutsToReturn = [[[NSMutableArray alloc] init] autorelease];
    NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;

    for (UIApplicationShortcutItem *item in shortcuts) {
        [shortcutsToReturn addObject:[self shortcutItemToDictionary:item]];
    }
    return shortcutsToReturn;
}

-(void)removeAllDynamicShortcuts:(id)unused
{
    [UIApplication sharedApplication].shortcutItems = nil;
}

-(NSArray*)listStaticShortcuts:(id)unused
{
    NSMutableArray *placeHolder = [[[NSMutableArray alloc] init] autorelease];
    
    NSArray *shortcuts = [NSBundle mainBundle].infoDictionary[@"UIApplicationShortcutItems"];
    
    if(shortcuts == nil || [shortcuts count] == 0) {
        return @[];
    }
    
    return shortcuts;
}

-(BOOL)typeContained:(NSString*)type
{
    UIApplicationShortcutItem *item;
    NSArray * shortcuts = [UIApplication sharedApplication].shortcutItems;
    for (item in shortcuts) {
        if ([item.type isEqualToString:type]) {
            return YES;
        }
    }
    
    return NO;
}

-(NSNumber*) dynamicShortcutExists:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if ([args objectForKey:@"type"] == nil) {
        NSLog(@"[ERROR] The type property required");
        return;
    }
    
    return NUMBOOL([self typeContained:[args objectForKey:@"type"]]);
}

-(void)removeShortcutItem:(id) args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if ([args objectForKey:@"type"] == nil) {
        NSLog(@"[ERROR] The shortcutType property required");
        return;
    }
    
    
    NSString* key = [TiUtils stringValue:@"type" properties:args];
    
    if ([self typeContained:key] == NO) {
        return;
    }
    
    NSMutableArray * shortcuts = (NSMutableArray*)[UIApplication sharedApplication].shortcutItems;
    
    for (UIApplicationShortcutItem *item in shortcuts) {
        if ([item.type isEqualToString:key]) {
            [shortcuts removeObject:item];
        }
    }
    
    [UIApplication sharedApplication].shortcutItems = shortcuts;
}


-(void)addShortcutItem:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if ([args objectForKey:@"type"] == nil) {
        NSLog(@"[ERROR] The type property required");
        return;
    }
    
    if ([args objectForKey:@"title"] == nil) {
        NSLog(@"[ERROR] The title property required");
        return;
    }
    
    if ([self typeContained:[args objectForKey:@"type"]]) {
        NSLog(@"[ERROR] The shortcutitem type %@ already exists. This field must be unique.",
              [args objectForKey:@"type"]);
        return;
    }
    
    UIApplicationShortcutItem *shortcut = nil;
    
    if ([args objectForKey:@"subtitle"] != nil) {
        if ([args objectForKey:@"icon"] == nil) {
            NSLog(@"[ERROR] You have defined a subtitle without defining an icon");
            return;
        } else {
            shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[args objectForKey:@"type"]
                                                         localizedTitle:[args objectForKey:@"title"]
                                                      localizedSubtitle:[args objectForKey:@"subtitle"]
                                                                   icon: [self findIcon:[args objectForKey:@"icon"]]
                                                               userInfo:[args objectForKey:@"userInfo"]]autorelease];
        }
    } else {
        if ([args objectForKey:@"icon"] != nil ||
           [args objectForKey:@"userInfo"] != nil) {
            NSLog(@"[ERROR] You have defined icon or userInfo without defining subTitle. You must defined subTitle if you haved defined icon or userInfo");
            return;
        } else {
            shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[args objectForKey:@"type"]
                                                         localizedTitle:[args objectForKey:@"title"]]autorelease];
        }
    }
    
    if (shortcut!=nil) {
        NSMutableArray *shortcuts = (NSMutableArray*) [UIApplication sharedApplication].shortcutItems;
        [shortcuts addObject:shortcut];
        [UIApplication sharedApplication].shortcutItems = shortcuts;
    }
    
}

-(UIApplicationShortcutIcon*)findIcon:(id)value
{
    if ([value isKindOfClass:[NSNumber class]]) {
        NSInteger iconIndex = [value integerValue];
        return [UIApplicationShortcutIcon iconWithType:iconIndex];
    }
    
    if ([value isKindOfClass:[NSString class]]) {
        return [UIApplicationShortcutIcon iconWithTemplateImageName:(NSString*)value];
    }
    
    NSLog(@"[ERROR] Invalid icon selection provided, defaulting to SHORTCUT_ICON_TYPE_COMPOSE");
    return UIApplicationShortcutIconTypeCompose;
}

@end
#endif
#endif