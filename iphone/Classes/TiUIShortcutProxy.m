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
        [NSNotificationCenter.defaultCenter removeObserver:self];
      },
      YES);
  [super _destroy];
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"click"]) {
    [NSNotificationCenter.defaultCenter addObserver:self
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
  NSArray<UIApplicationShortcutItem *> *shortcuts = UIApplication.sharedApplication.shortcutItems;
  NSMutableArray<TiUIShortcutItemProxy *> *shortcutsToReturn = [NSMutableArray arrayWithCapacity:shortcuts.count];
  for (UIApplicationShortcutItem *item in shortcuts) {
    [shortcutsToReturn addObject:[[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease]];
  }

  return shortcutsToReturn;
}

- (NSArray<TiUIShortcutItemProxy *> *)staticItems
{
  NSArray<NSDictionary *> *shortcuts = NSBundle.mainBundle.infoDictionary[@"UIApplicationShortcutItems"];
  if (shortcuts == nil || shortcuts.count == 0) {
    return @[];
  }

  NSMutableArray<TiUIShortcutItemProxy *> *shortcutsToReturn = [NSMutableArray arrayWithCapacity:shortcuts.count];
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
  NSArray<UIApplicationShortcutItem *> *shortcuts = UIApplication.sharedApplication.shortcutItems;
  if (shortcuts != nil && shortcuts.count > 0) {
    NSString *type = [TiUtils stringValue:identifier];
    for (UIApplicationShortcutItem *item in shortcuts) {
      if ([item.type isEqualToString:type]) {
        return [[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease];
      }
    }
  }
  return nil;
}

- (void)remove:(TiUIShortcutItemProxy *)shortcut
{
  NSArray<UIApplicationShortcutItem *> *shortcuts = UIApplication.sharedApplication.shortcutItems;
  if (shortcuts != nil && shortcuts.count > 0) {
    NSString *key = shortcut.shortcutItem.type;
    NSMutableArray<UIApplicationShortcutItem *> *shortcutsCopy = [shortcuts mutableCopy];
    for (UIApplicationShortcutItem *item in shortcutsCopy) {
      if ([item.type isEqualToString:key]) {
        [shortcutsCopy removeObject:item];
        break;
      }
    }
    UIApplication.sharedApplication.shortcutItems = shortcutsCopy;
    RELEASE_TO_NIL(shortcutsCopy);
  }
}

- (void)removeAll
{
  UIApplication.sharedApplication.shortcutItems = nil;
}

- (void)add:(TiUIShortcutItemProxy *)shortcut
{
  NSArray<UIApplicationShortcutItem *> *shortcuts = UIApplication.sharedApplication.shortcutItems;
  if (shortcuts != nil && shortcuts.count > 0) {
    NSString *key = shortcut.shortcutItem.type;
    NSMutableArray<UIApplicationShortcutItem *> *shortcutsCopy = [shortcuts mutableCopy];
    // Remove previous shortcutitem of same id if exists
    __block NSUInteger index = shortcuts.count;
    [shortcutsCopy enumerateObjectsUsingBlock:^(UIApplicationShortcutItem *_Nonnull item, NSUInteger idx, BOOL *_Nonnull stop) {
      if ([item.type isEqualToString:key]) {
        index = idx;
        [shortcutsCopy removeObject:item];
        *stop = true;
      }
    }];
    [shortcutsCopy insertObject:shortcut.shortcutItem atIndex:index];
    shortcuts = shortcutsCopy;
  } else {
    shortcuts = @[ shortcut.shortcutItem ];
  }
  UIApplication.sharedApplication.shortcutItems = shortcuts;
}

- (void)didReceiveShortcutNotification:(NSNotification *)info
{
  if ([self _hasListeners:@"click"]) {
    NSDictionary *userInfo = info.userInfo;
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
