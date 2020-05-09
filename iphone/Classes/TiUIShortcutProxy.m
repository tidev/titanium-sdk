/**
* Appcelerator Titanium Mobile
* Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
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
    // [self rememberSelf];
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
  // [self rememberSelf];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector
                                           (didReceiveApplicationShortcutNotification:)
                                               name:kTiApplicationShortcut
                                             object:nil];
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray *)items
{
  NSMutableArray *shortcutsToReturn = [NSMutableArray array];
  NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;

  for (UIApplicationShortcutItem *item in shortcuts) {
    [shortcutsToReturn addObject:[[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease]];
  }

  return shortcutsToReturn;
}

- (NSArray *)staticItems
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

    [shortcutsToReturn addObject:[[[TiUIShortcutItemProxy alloc] initWithShortcutItem:shortcut] autorelease]];
  }

  return shortcutsToReturn;
}

- (TiUIShortcutItemProxy *)getById:(id)identifier
{
  ENSURE_SINGLE_ARG(identifier, NSString);

  NSArray *shortcuts = [UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[TiUtils stringValue:identifier]]) {
      return [[[TiUIShortcutItemProxy alloc] initWithShortcutItem:item] autorelease];
    }
  }

  return nil;
}

- (void)remove:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiUIShortcutItemProxy);

  NSString *key = [((TiUIShortcutItemProxy *)arg) shortcutItem].type;

  NSMutableArray *shortcuts = (NSMutableArray *)[UIApplication sharedApplication].shortcutItems;
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[((TiUIShortcutItemProxy *)arg) shortcutItem].type]) {
      [shortcuts removeObject:item];
      break;
    }
  }
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (void)removeAll:(id)unused
{
  [UIApplication sharedApplication].shortcutItems = nil;
}

- (void)add:(id)arg
{
  ENSURE_SINGLE_ARG(arg, TiUIShortcutItemProxy);

  NSMutableArray *shortcuts = (NSMutableArray *)[UIApplication sharedApplication].shortcutItems;

  // remove the previous shortcutitem of same id if exists
  for (UIApplicationShortcutItem *item in shortcuts) {
    if ([item.type isEqualToString:[((TiUIShortcutItemProxy *)arg) shortcutItem].type]) {
      [shortcuts removeObject:item];
      break;
    }
  }
  [shortcuts addObject:[((TiUIShortcutItemProxy *)arg) shortcutItem]];
  [UIApplication sharedApplication].shortcutItems = shortcuts;
}

- (void)didReceiveApplicationShortcutNotification:(NSNotification *)info
{
  if ([self _hasListeners:@"click"]) {
    UIApplicationShortcutItem *shortcut = [[[UIApplicationShortcutItem alloc] initWithType:[[info userInfo] valueForKey:@"type"]
                                                                            localizedTitle:[[info userInfo] valueForKey:@"title"]
                                                                         localizedSubtitle:[[info userInfo] valueForKey:@"subtitle"]
                                                                                      icon:nil
                                                                                  userInfo:[[info userInfo] objectForKey:@"userInfo"]] autorelease];
    [self fireEvent:@"click" withDict:@{ @"item" : [[[TiUIShortcutItemProxy alloc] initWithShortcutItem:shortcut] autorelease] }];
  }
}
@end
#endif
