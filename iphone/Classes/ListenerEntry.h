/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"
#import "TiEvaluator.h"

@interface ListenerEntry : NSObject {
@private
	id<TiEvaluator> context;
	id listener;
	TiProxy *proxy;
	NSString *type;
}
@property(nonatomic,readwrite,retain) NSString *type;

-(id)initWithListener:(id)listener_ context:(id<TiEvaluator>)context_ proxy:(TiProxy*)proxy;
-(id<TiEvaluator>)context;
-(id)listener;
@end
