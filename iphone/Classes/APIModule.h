;/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <JavaScriptCore/JavaScriptCore.h>
#import "TiModule.h"

@protocol APIExports <JSExport>

@property (readonly) NSString *apiName;

- (void)debug:(id)args;
- (void)info:(id)args;
- (void)warn:(id)args;
- (void)error:(id)args;
- (void)trace:(id)args;
- (void)timestamp:(id)args;
- (void)notice:(id)args;
- (void)critical:(id)args;
JSExportAs(log,
- (void)log:(id)level withMessage:(id)args
);
- (void)reportUnhandledException:(NSArray *)args;

@end

@interface APIModule : TiModule <APIExports>
- (void)logMessage:(id)messages severity:(NSString *)severity; // Used by TiConsole
@end
