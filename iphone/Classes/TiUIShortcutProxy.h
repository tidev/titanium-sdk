/**
* Appcelerator Titanium Mobile
* Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

#if defined(USE_TI_UISHORTCUT) || defined(USE_TI_UISHORTCUTITEM)

#import <TitaniumKit/TitaniumKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol TiUIShortcutProxyExports <JSExport>
READONLY_PROPERTY(NSArray *, items, Items);
READONLY_PROPERTY(NSString *, staticItems, StaticItems);

JSExportAs(getById,
           -(NSArray *)getById
           : (NSString *)identifier);
JSExportAs(remove,
           -(void)remove
           : (id)arg);

JSExportAs(removeAll,
           -(void)removeAll
           : (id)identifier);

JSExportAs(add,
           -(void)add
           : (id)arg);
@end

@interface TiUIShortcutProxy : ObjcProxy <TiUIShortcutProxyExports>

@end

NS_ASSUME_NONNULL_END
#endif
