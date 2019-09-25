/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSAPPLICATIONSHORTCUTS
#import "TiUIiOSApplicationShortcutsProxy.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>
#ifdef USE_TI_CONTACTS
#import "TiContactsPerson.h"
#endif
#import <CommonCrypto/CommonDigest.h>
#import <ContactsUI/ContactsUI.h>

@implementation TiUIiOSApplicationShortcutsProxy

- (NSString *)apiName
{
  return @"Ti.Ui.iOS.ApplicationShortcuts";
}

- (NSDictionary *)shortcutItemToDictionary:(UIApplicationShortcutItem *)item
{
  NSMutableDictionary *dict = [NSMutableDictionary
      dictionaryWithObjectsAndKeys:item.type, @"itemtype",
      nil];

  if (item.localizedTitle != nil) {
    [dict setObject:item.localizedTitle forKey:@"title"];
  }

  if (item.localizedSubtitle != nil) {
    [dict setObject:item.localizedSubtitle forKey:@"subtitle"];
  }

  if (item.userInfo != nil) {
    [dict setObject:item.userInfo forKey:@"userInfo"];
  }

  return dict;
}

- (NSArray *)listDynamicShortcuts:(id)unused
{
  NSMutableArray *shortcutsToReturn = [NSMutableArray array];
  NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;

  for (UIApplicationShortcutItem *item in shortcuts) {
    [shortcutsToReturn addObject:[self shortcutItemToDictionary:item]];
  }

  return shortcutsToReturn;
}

- (void)removeAllDynamicShortcuts:(id)unused
{
  [UIApplication sharedApplication].shortcutItems = nil;
}

- (NSArray *)listStaticShortcuts:(id)unused
{
  NSMutableArray *shortcutsToReturn = [NSMutableArray array];
  NSArray *shortcuts = [NSBundle mainBundle].infoDictionary[@"UIApplicationShortcutItems"];

  if (shortcuts == nil || [shortcuts count] == 0) {
    return @[];
  }

  for (id item in shortcuts) {
    // We need to map the plist-keys manually for static shortcuts
    NSString *type = [item valueForKey:@"UIApplicationShortcutItemType"];
    NSString *title = [item valueForKey:@"UIApplicationShortcutItemTitle"];
    NSString *subtitle = [item valueForKey:@"UIApplicationShortcutItemSubtitle"];
    UIApplicationShortcutIcon *icon = [UIApplicationShortcutIcon iconWithType:[TiUtils intValue:[item valueForKey:@"UIApplicationShortcutItemIconType"]]];
    NSDictionary *userInfo = [item valueForKey:@"UIApplicationShortcutItemUserInfo"];

    UIApplicationShortcutItem *shortcut = [[[UIApplicationShortcutItem alloc] initWithType:type
                                                                            localizedTitle:title
                                                                         localizedSubtitle:subtitle
                                                                                      icon:icon
                                                                                  userInfo:userInfo] autorelease];

    [shortcutsToReturn addObject:[self shortcutItemToDictionary:shortcut]];
  }

  return shortcutsToReturn;
}

- (BOOL)typeExists:(NSString *)type
{
  NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:type]) {
      return YES;
    }
  }

  return NO;
}

- (NSNumber *)dynamicShortcutExists:(id)itemtype
{
  ENSURE_SINGLE_ARG(itemtype, NSString);

  if ([TiUtils stringValue:itemtype] == nil) {
    NSLog(@"[ERROR] Ti.UI.iOS.ApplicationShortcuts: The \"itemtype\" property is required.");
    return;
  }

  return NUMBOOL([self typeExists:[TiUtils stringValue:itemtype]]);
}

- (NSDictionary *)getDynamicShortcut:(id)itemtype
{
  ENSURE_SINGLE_ARG(itemtype, NSString);

  NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[TiUtils stringValue:itemtype]]) {
      return [self shortcutItemToDictionary:item];
    }
  }

  return nil;
}

- (void)removeDynamicShortcut:(id)itemtype
{
  ENSURE_SINGLE_ARG(itemtype, NSString);

  NSString *key = [TiUtils stringValue:itemtype];

  if (key == nil) {
    NSLog(@"[ERROR] The \"itemtype\" property is required.");
    return;
  }

  if (![self typeExists:key]) {
    return;
  }

  NSMutableArray *shortcuts = (NSMutableArray *)[UIApplication sharedApplication].shortcutItems;
  NSMutableIndexSet *shortcutsIndicesToDelete = [[NSMutableIndexSet alloc] init];

  [shortcuts enumerateObjectsUsingBlock:^(UIApplicationShortcutItem *_Nonnull obj, NSUInteger idx, BOOL *_Nonnull stop) {
    if ([obj.type isEqualToString:key]) {
      [shortcutsIndicesToDelete addIndex:idx];
    }
  }];

  [shortcuts removeObjectsAtIndexes:shortcutsIndicesToDelete];
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (void)addDynamicShortcut:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary);

  if ([args objectForKey:@"itemtype"] == nil) {
    NSLog(@"[ERROR] Ti.UI.iOS.ApplicationShortcuts: The \"itemtype\" property is required.");
    return;
  }

  if ([args objectForKey:@"title"] == nil) {
    NSLog(@"[ERROR] Ti.UI.iOS.ApplicationShortcuts: The \"title\" property is required.");
    return;
  }

  if ([self typeExists:[args objectForKey:@"itemtype"]]) {
    NSLog(@"[ERROR] Ti.UI.iOS.ApplicationShortcuts: The itemtype for the shortcut %@ already exists. This field must be unique.",
        [args objectForKey:@"itemtype"]);
    return;
  }

  UIApplicationShortcutItem *shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[args objectForKey:@"itemtype"]
                                                                          localizedTitle:[args objectForKey:@"title"]
                                                                       localizedSubtitle:[args objectForKey:@"subtitle"]
                                                                                    icon:[self findIcon:[args objectForKey:@"icon"]]
                                                                                userInfo:[args objectForKey:@"userInfo"]] autorelease];

  NSMutableArray *shortcuts = (NSMutableArray *)[UIApplication sharedApplication].shortcutItems;
  [shortcuts addObject:shortcut];
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (UIApplicationShortcutIcon *)findIcon:(id)value
{
  if (value == nil) {
    return nil;
  }

#ifdef USE_TI_CONTACTS
  if ([value isKindOfClass:[TiContactsPerson class]]) {
    ENSURE_TYPE(value, TiContactsPerson);
    return [UIApplicationShortcutIcon iconWithContact:[(TiContactsPerson *)value nativePerson]];
  }
#endif

  if ([value isKindOfClass:[UIApplicationShortcutIcon class]]) {
    return (UIApplicationShortcutIcon *)value;
  }

  if ([value isKindOfClass:[NSNumber class]]) {
    NSInteger iconIndex = [value integerValue];
    return [UIApplicationShortcutIcon iconWithType:iconIndex];
  }

  if ([value isKindOfClass:[NSString class]]) {
    return [UIApplicationShortcutIcon iconWithTemplateImageName:[self urlInAssetCatalog:value]];
  }

#ifdef IS_SDK_IOS_13
  if ([value isKindOfClass:[TiBlob class]] && [TiUtils isIOSVersionOrGreater:@"13.0"]) {
    TiBlob *blob = (TiBlob *)value;
    if (blob.type == TiBlobTypeSystemImage) {
      return [UIApplicationShortcutIcon iconWithSystemImageName:blob.systemImageName];
    }
  }
#endif

  NSLog(@"[ERROR] Ti.UI.iOS.ApplicationShortcuts: Invalid icon provided, defaulting to use no icon.");
  return nil;
}

- (NSString *)urlInAssetCatalog:(NSString *)url
{
  NSString *resultUrl = nil;

  if ([url hasPrefix:@"/"]) {
    url = [url substringFromIndex:1];
  }

  unsigned char digest[CC_SHA1_DIGEST_LENGTH];
  NSData *stringBytes = [url dataUsingEncoding:NSUTF8StringEncoding];
  if (CC_SHA1([stringBytes bytes], (CC_LONG)[stringBytes length], digest)) {
    // SHA-1 hash has been calculated and stored in 'digest'.
    NSMutableString *sha = [[NSMutableString alloc] init];
    for (int i = 0; i < CC_SHA1_DIGEST_LENGTH; i++) {
      [sha appendFormat:@"%02x", digest[i]];
    }
    [sha appendString:@"."];
    [sha appendString:[url pathExtension]];
    resultUrl = [NSMutableString stringWithString:sha];
    RELEASE_TO_NIL(sha)
  }

  return resultUrl;
}

@end
#endif
