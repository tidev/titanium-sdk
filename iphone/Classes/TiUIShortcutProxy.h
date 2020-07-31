/**
* Appcelerator Titanium Mobile
* Copyright (c) 2020 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

#if defined(USE_TI_UISHORTCUT) || defined(USE_TI_UISHORTCUTITEM)

#import <TitaniumKit/TiProxy.h>

@class TiUIShortcutItemProxy;

@interface TiUIShortcutProxy : TiProxy {
  @private
}

NS_ASSUME_NONNULL_BEGIN

/*
READONLY_PROPERTY(NSArray<TiUIShortcutItemProxy *> *, items, Items);
READONLY_PROPERTY(NSArray<TiUIShortcutItemProxy *> *, staticItems, StaticItems);

- (TiUIShortcutItemProxy *)getById:(NSString *)identifier;
- (void)remove:(TiUIShortcutItemProxy *)shortcut;
- (void)removeAll;
- (void)add:(TiUIShortcutItemProxy *)shortcut;
*/

@property (nonatomic, readonly) NSArray<TiUIShortcutItemProxy *> *items;
@property (nonatomic, readonly) NSArray<TiUIShortcutItemProxy *> *staticItems;

- (TiUIShortcutItemProxy *)getById:(id)args;
- (void)remove:(id)args;
- (void)removeAll:(id)unused;
- (void)add:(id)args;

@end

NS_ASSUME_NONNULL_END
#endif
