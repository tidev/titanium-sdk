/**
* Appcelerator Titanium Mobile
* Copyright (c) 2020 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/
#if defined(USE_TI_UISHORTCUT) || defined(USE_TI_UISHORTCUTITEM)

#import "TiUIShortcutItemProxy.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>
#ifdef USE_TI_CONTACTS
#import "TiContactsPerson.h"
#import <ContactsUI/ContactsUI.h>
#endif
@implementation TiUIShortcutItemProxy

- (NSString *)apiName
{
  return @"Ti.UI.ShortcutItem";
}

- (void)dealloc
{
  RELEASE_TO_NIL(_shortcutItem);

  [super dealloc];
}

- (id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray *)args
{
  if (self = [self _initWithPageContext:context_]) {
    ENSURE_SINGLE_ARG(args, NSDictionary);
    if ([args valueForKey:@"id"] == nil) {
      NSLog(@"[ERROR] Ti.UI.ShortcutItem: The \"id\" property is required.");
      return;
    }

    if ([args valueForKey:@"title"] == nil) {
      NSLog(@"[ERROR] Ti.UI.ShortcutItem: The \"title\" property is required.");
      return;
    }

    _shortcutItem = [[UIApplicationShortcutItem alloc] initWithType:[args valueForKey:@"id"]
                                                     localizedTitle:[args valueForKey:@"title"]
                                                  localizedSubtitle:[args valueForKey:@"description"]
                                                               icon:[self findIcon:[args valueForKey:@"icon"]]
                                                           userInfo:[args valueForKey:@"data"]];
  }
  return self;
}

- (id)initWithShortcutItem:(UIApplicationShortcutItem *)item
{
  if (self = [super init]) {
    _shortcutItem = [item retain];
  }
  return self;
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
    value = ([value hasPrefix:@"/"]) ? [value substringFromIndex:1] : value;
    return [UIApplicationShortcutIcon iconWithTemplateImageName:value];
  }

#if IS_SDK_IOS_13
  if ([value isKindOfClass:[TiBlob class]] && [TiUtils isIOSVersionOrGreater:@"13.0"]) {
    TiBlob *blob = (TiBlob *)value;
    if (blob.type == TiBlobTypeSystemImage) {
      return [UIApplicationShortcutIcon iconWithSystemImageName:blob.systemImageName];
    }
  }
#endif
  NSLog(@"[ERROR] Ti.UI.ApplicationShortcuts: Invalid icon provided, defaulting to use no icon.");
  return nil;
}

- (UIApplicationShortcutItem *)shortcutItem
{
  return _shortcutItem;
}

- (NSString *)id
{
  return _shortcutItem.type;
}

- (NSString *)title
{
  return _shortcutItem.localizedTitle;
}

- (NSString *)description
{
  return NULL_IF_NIL(_shortcutItem.localizedSubtitle);
}

- (NSDictionary *)data
{
  return NULL_IF_NIL(_shortcutItem.userInfo);
}

- (id)icon
{
  return NULL_IF_NIL(_shortcutItem.icon);
}
@end
#endif
