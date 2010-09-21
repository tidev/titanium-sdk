/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

@interface TiStylesheet : NSObject {
	NSDictionary* classesDict;
	NSDictionary* classesDictByDensity;
	NSDictionary* idsDict;
	NSDictionary* idsDictByDensity;
}

-(id)stylesheet:(NSString*)objectId type:(NSString*)type density:(NSString*)density basename:(NSString*)basename;

@end
