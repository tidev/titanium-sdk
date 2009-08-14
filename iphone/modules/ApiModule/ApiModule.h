/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_API

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface ApiModule : NSObject<TitaniumModule> {

}

@end
/*

 @tiapi(method=true,name=API.critical,since=0.4) logs an object with severity "critical"
 @tiarg(for=API.critical,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.debug,since=0.4) logs an object with severity "debug"
 @tiarg(for=API.debug,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.error,since=0.4) logs an object with severity "error"
 @tiarg(for=API.error,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.fatal,since=0.4) logs an object with severity "fatal"
 @tiarg(for=API.fatal,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.info,since=0.4) logs an object with severity "info"
 @tiarg(for=API.info,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.log,since=0.4) writes information to the console log/STDERR
 @tiarg(for=API.log,name=severity,type=string) the severity of the message
 @tiarg(for=API.log,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.notice,since=0.4) logs an object with severity "notice"
 @tiarg(for=API.notice,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.trace,since=0.4) logs an object with severity "trace"
 @tiarg(for=API.trace,name=note,type=string) the value to log
 
 @tiapi(method=true,name=API.warn,since=0.4) logs an object with severity "warn"
 @tiarg(for=API.warn,name=note,type=string) the value to log
 
 */

#endif