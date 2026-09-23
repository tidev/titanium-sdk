/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"
@import JavaScriptCore;

@protocol ScriptExports <JSExport>

JSExportAs(runInThisContext,
           -(JSValue *)runInThisContext
           : (NSString *)source withFilename
           : (NSString *)filename displayError
           : (BOOL)displayError);
@end

@interface ScriptModule : ObjcModule <ScriptExports>
@end
