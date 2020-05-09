/**
* Appcelerator Titanium Mobile
* Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/
#if defined(USE_TI_UISHORTCUT) || defined(USE_TI_UISHORTCUTITEM)

#import <TitaniumKit/TitaniumKit.h>

NS_ASSUME_NONNULL_BEGIN
@protocol TiUIShortcutItemProxyExports <JSExport>

READONLY_PROPERTY(NSString *, title, Title);
READONLY_PROPERTY(NSString *, description, Description);
READONLY_PROPERTY(NSDictionary *, data, Data);
READONLY_PROPERTY(id, icon, Icon);
READONLY_PROPERTY(NSString *, id, Id);

@end

@interface TiUIShortcutItemProxy : ObjcProxy <TiUIShortcutItemProxyExports> {
  UIApplicationShortcutItem *_shortcutItem;
}

// Internal use only
- (id)initWithShortcutItem:(UIApplicationShortcutItem *)item;
- (UIApplicationShortcutItem *)shortcutItem;

@end

NS_ASSUME_NONNULL_END
#endif
