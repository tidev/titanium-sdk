/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"
@import JavaScriptCore;

@protocol KrollExports <JSExport>

- (BOOL)isExternalCommonJsModule:(NSString *)moduleID;
- (NSString *)getExternalCommonJsModule:(NSString *)moduleID;
- (JSValue *)binding:(NSString *)moduleID;

@end

@interface KrollModule : ObjcModule <KrollExports> {
  @private
  NSSet<NSString *> *_coreModules;
}

/**
 * @param moduleID is assumed to be the module name (classname with the "Module" suffix stripped off) - i.e. "UI", "App", "Media"
 * We will generate the full class name from the moduleID: "UI" => "UIModule", "com.appcelerator.urlSession" => "ComAppceleratorUrlSessionModule"
 * @return TiModule* or ObjcProxy* based on whether the module is an older style proxy moduel or a new Obj-C JSC API style (currently only 1st party in-SDK code)
 */
+ (id<Module>)loadCoreModule:(NSString *)moduleID inContext:(JSContext *)jsContext;

@end
