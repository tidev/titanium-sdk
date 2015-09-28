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
    
    if (item.localizedTitle !=nil) {
        [dict setObject:item.localizedTitle forKey:@"title" ];
    }
    
    if (item.localizedSubtitle !=nil) {
        [dict setObject:item.localizedSubtitle forKey:@"subtitle" ];
    }
    
    if(item.userInfo !=nil){
        [dict setObject:item.userInfo forKey:@"userInfo"];
    }
    
    if(item.userInfo !=nil){
        [dict setObject:item.userInfo forKey:@"userInfo"];
    }
    return dict;
}

-(NSArray*)listDynamicShortcuts:(id)unused
{
    NSMutableArray *shortcutsToReturn = [[[NSMutableArray alloc] init] autorelease];
    NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;
    UIApplicationShortcutItem *item;
    for (item in shortcuts) {
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
    
    if(shortcuts == nil){
        return placeHolder;
    }
    
    if([shortcuts count] == 0){
        return placeHolder;
    }
    return shortcuts;
}

-(BOOL)typeContained:(NSString*)type
{
    BOOL found = NO;
    UIApplicationShortcutItem *item;
    NSArray * shortcuts = [UIApplication sharedApplication].shortcutItems;
    for (item in shortcuts) {
        if([item.type isEqualToString:type]){
            found = YES;
        }
    }
    
    return found;
}

-(NSNumber*) dynamicShortcutExists:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if([args objectForKey:@"type"]==nil){
        NSLog(@"[ERROR] shortcutType property required");
        return;
    }
    
    return NUMBOOL([self typeContained:[args objectForKey:@"type"]]);
}

-(void)removeShortcutItem:(id) args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if([args objectForKey:@"type"]==nil){
        NSLog(@"[ERROR] shortcutType property required");
        return;
    }
    
    id key = [args objectForKey:@"type"];
    
    if([self typeContained:key]==NO){
        return;
    }
    
    NSMutableArray * shortcuts = (NSMutableArray*)[UIApplication sharedApplication].shortcutItems;
    UIApplicationShortcutItem *item;
    NSMutableArray *discardedItems = [NSMutableArray array];
    
    for (item in shortcuts) {
        if (item.type == key){
            [discardedItems addObject:item];
        }
    }
    
    [shortcuts removeObjectsInArray:discardedItems];
    [UIApplication sharedApplication].shortcutItems = shortcuts;
}


-(void)addShortcutItem:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    if([args objectForKey:@"type"]==nil){
        NSLog(@"[ERROR] type property required");
        return;
    }
    
    if([args objectForKey:@"title"]==nil){
        NSLog(@"[ERROR] title property required");
        return;
    }
    
    if([self typeContained:[args objectForKey:@"type"]]){
        NSLog(@"[ERROR] The shortcutitem type %@ already exists. This field must be unique.",
              [args objectForKey:@"type"]);
        return;
    }
    
    UIApplicationShortcutItem *shortcut = nil;
    
    if([args objectForKey:@"subtitle"]!=nil){
        if([args objectForKey:@"icon"]==nil){
            NSLog(@"[ERROR] you have defined a subtitle without defining an icon");
            return;
        }else{
            shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[args objectForKey:@"type"]
                                                         localizedTitle:[args objectForKey:@"title"]
                                                      localizedSubtitle:[args objectForKey:@"subtitle"]
                                                                   icon: [self findIcon:[args objectForKey:@"icon"]]
                                                               userInfo:[args objectForKey:@"userInfo"]]autorelease];
        }
    }else{
        if([args objectForKey:@"icon"]!=nil ||
           [args objectForKey:@"userInfo"]!=nil){
            NSLog(@"[ERROR] you have defined icon or userInfo without defining subTitle. You must defined subTitle if you haved defined icon or userInfo");
            return;
        }else{
            shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[args objectForKey:@"type"]
                                                         localizedTitle:[args objectForKey:@"title"]]autorelease];
        }
    }
    
    if(shortcut!=nil){
        NSMutableArray *shortcuts = (NSMutableArray*) [UIApplication sharedApplication].shortcutItems;
        [shortcuts addObject:shortcut];
        [UIApplication sharedApplication].shortcutItems = shortcuts;
    }
    
}

-(UIApplicationShortcutIcon*)findIcon:(id)value
{
    if([value isKindOfClass:[NSNumber class]]){
        NSInteger iconIndex = [value integerValue];
        return [UIApplicationShortcutIcon iconWithType:iconIndex];
    }
    
    if([value isKindOfClass:[NSString class]]){
        return [UIApplicationShortcutIcon iconWithTemplateImageName:(NSString*)value];
    }
    
    NSLog(@"[ERROR] invalid icon selection provided, defaulting to SHORTCUT_ICON_TYPE_COMPOSE");
    return UIApplicationShortcutIconTypeCompose;
}

@end
#endif
#endif