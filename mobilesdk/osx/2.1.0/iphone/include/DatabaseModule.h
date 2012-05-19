/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_DATABASE

typedef enum {
	FieldTypeUnknown = -1,
	FieldTypeString,
	FieldTypeInt,
	FieldTypeFloat,
	FieldTypeDouble
} DatabaseFieldType;

@interface DatabaseModule : TiModule {
}

@end

#endif