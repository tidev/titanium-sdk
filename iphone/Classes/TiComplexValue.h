/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// this is simply a wrapper for properties which have "withObject"
// argument semantics that need to be stored inside our proxy until the
// view is available.  currently the key/value store of the properties
// makes it difficult to handle without marshalling them inside a wrapped
// container like this.

@interface TiComplexValue : NSObject {
	id value;
	NSDictionary *properties;
}

-(id)initWithValue:(id)value properties:(NSDictionary*)properties;

@property(nonatomic,readonly) id value;
@property(nonatomic,readonly) NSDictionary *properties;

@end
