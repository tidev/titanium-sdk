/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 The class representing a range object.
 @deprecated
 */
@interface TiRange : NSObject 
{
	NSRange range;
}

/**
 Initializes the range object from range struct.
 @param range The range struct.
 */
-(id)initWithRange:(NSRange)range;

/**
 Provides access to the range location.
 */
@property(nonatomic,readwrite,assign) id location;

/**
 Provides access to the range length.
 */
@property(nonatomic,readwrite,assign) id length;

@end
