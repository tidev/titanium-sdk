/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@interface TiRange : NSObject 
{
	NSRange range;
}

-(id)initWithRange:(NSRange)range;

@property(nonatomic,readwrite,assign) id location;
@property(nonatomic,readwrite,assign) id length;

@end
