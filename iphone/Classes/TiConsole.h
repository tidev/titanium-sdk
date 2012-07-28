/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "APIModule.h"

// This is a version of the API module which has custom support for log() to
// make it behave like standard console.log(). This can be removed once we
// deprecate/remove/replace existing Ti.API.log() custom severity, which interferes
// with the ability to correctly process log() requests with exactly two arguments.
@interface TiConsole : APIModule

@end
