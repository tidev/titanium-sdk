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
 * @tiapi(method=True,name=API.log,since=0.4) writes information to the console log/STDERR
 * @tiarg(for=API.log,type=string,name=severity,optional=True) the severity of the message. If omitted, the severity is "info"
 * @tiarg(for=API.log,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.debug,since=0.4) logs an object with severity "debug"
 * @tiarg(for=API.debug,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.error,since=0.4) logs an object with severity "error"
 * @tiarg(for=API.error,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.warn,since=0.4) logs an object with severity "warn"
 * @tiarg(for=API.warn,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.info,since=0.4) logs an object with severity "info"
 * @tiarg(for=API.info,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.trace,since=0.4) logs an object with severity "trace"
 * @tiarg(for=API.trace,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.notice,since=0.4) logs an object with severity "notice"
 * @tiarg(for=API.notice,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.critical,since=0.4) logs an object with severity "critical"
 * @tiarg(for=API.critical,type=string,name=note) the object, string, or integer to log.
 *
 * @tiapi(method=True,name=API.fatal,since=0.4) logs an object with severity "fatal"
 * @tiarg(for=API.fatal,type=string,name=note) the object, string, or integer to log.
 */

#endif