/**
* Appcelerator Titanium Mobile
* Copyright (c) 2020 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/
#if defined(USE_TI_UISHORTCUT) || defined(USE_TI_UISHORTCUTITEM)

#import "TiUIShortcutProxy.h"
#import "TiUIShortcutItemProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIShortcutProxy

- (NSString *)apiName
{
  return @"Ti.UI.Shortcut";
}

- (id)init
{
  if (self = [super init]) {
  }
  return self;
}

- (void)_destroy
{
  TiThreadPerformOnMainThread(
      ^{
        [[NSNotificationCenter defaultCenter] removeObserver:self];
      },
      YES);
  [super _destroy];
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"click"]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector
                                             (didReceiveShortcutNotification:)
                                                 name:kTiApplicationShortcut
                                               object:nil];
    [self retain];
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"click"]) {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self release];
  }
}

- (NSArray<TiUIShortcutItemProxy *> *)items
{
  NSMutableArray<TiUIShortcutItemProxy *> *shortcutsToReturn = [NSMutableArray array];
  NSArray<UIApplicationShortcutItem *> *shortcuts = [UIApplication sharedApplication].shortcutItems;

  for (UIApplicationShortcutItem *item in shortcuts) {
    [shortcutsToReturn addObject:[[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease]];
  }

  return shortcutsToReturn;
}

- (NSArray<TiUIShortcutItemProxy *> *)staticItems
{
  NSMutableArray<TiUIShortcutItemProxy *> *shortcutsToReturn = [NSMutableArray array];
  NSArray<NSDictionary *> *shortcuts = [NSBundle mainBundle].infoDictionary[@"UIApplicationShortcutItems"];

  if (shortcuts == nil || [shortcuts count] == 0) {
    return @[];
  }

  for (NSDictionary *item in shortcuts) {
    // We need to map the plist-keys manually for static shortcuts
    NSString *type = item[@"UIApplicationShortcutItemType"];
    NSString *title = item[@"UIApplicationShortcutItemTitle"];
    NSString *subtitle = item[@"UIApplicationShortcutItemSubtitle"];
    UIApplicationShortcutIcon *icon = [UIApplicationShortcutIcon iconWithType:[TiUtils intValue:item[@"UIApplicationShortcutItemIconType"]]];
    NSDictionary *userInfo = item[@"UIApplicationShortcutItemUserInfo"];

    UIApplicationShortcutItem *shortcut = [[[UIApplicationShortcutItem alloc] initWithType:type
                                                                            localizedTitle:title
                                                                         localizedSubtitle:subtitle
                                                                                      icon:icon
                                                                                  userInfo:userInfo] autorelease];

    [shortcutsToReturn addObject:[[[TiUIShortcutItemProxy alloc] initWithShortcutItem:shortcut] autorelease]];
  }

  return shortcutsToReturn;
}

- (TiUIShortcutItemProxy *)getById:(NSString *)identifier
{
  NSArray<UIApplicationShortcutItem *> *shortcuts = [UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[TiUtils stringValue:identifier]]) {
      return [[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease];
    }
  }

  return nil;
}

- (void)remove:(TiUIShortcutItemProxy *)shortcut
{
  NSString *key = [shortcut shortcutItem].type;

  NSMutableArray<UIApplicationShortcutItem *> *shortcuts = (NSMutableArray<UIApplicationShortcutItem *> *)[UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[shortcut shortcutItem].type]) {
      [shortcuts removeObject:item];
      break;
    }
  }
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (void)removeAll
{
  [UIApplication sharedApplication].shortcutItems = nil;
}

- (void)add:(TiUIShortcutItemProxy *)shortcut
{
  NSMutableArray<UIApplicationShortcutItem *> *shortcuts = (NSMutableArray<UIApplicationShortcutItem *> *)[UIApplication sharedApplication].shortcutItems;

  // Remove previous shortcutitem of same id if exists
  __block NSUInteger index = shortcuts.count;
  [shortcuts enumerateObjectsUsingBlock:^(UIApplicationShortcutItem *_Nonnull item, NSUInteger idx, BOOL *_Nonnull stop) {
    if ([item.type isEqualToString:[shortcut shortcutItem].type]) {
      index = idx;
      [shortcuts removeObject:item];
      *stop = true;
    }
  }];
  [shortcuts insertObject:[shortcut shortcutItem] atIndex:index];
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (void)didReceiveShortcutNotification:(NSNotification *)info
{
  if ([self _hasListeners:@"click"]) {
    NSDictionary *userInfo = [info userInfo];
    UIApplicationShortcutItem *shortcut = [[[UIApplicationShortcutItem alloc] initWithType:userInfo[@"type"]
                                                                            localizedTitle:userInfo[@"title"]
                                                                         localizedSubtitle:userInfo[@"subtitle"]
                                                                                      icon:nil
                                                                                  userInfo:userInfo[@"userInfo"]] autorelease];
    [self fireEvent:@"click" withDict:@{ @"item" : [[[TiUIShortcutItemProxy alloc] initWithShortcutItem:shortcut] autorelease] }];
  }
}
@end
#endif
