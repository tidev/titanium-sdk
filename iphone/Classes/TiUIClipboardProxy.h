/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"

@interface TiUIClipboardProxy : TiProxy {
@private
}

-(void)clearData:(id)args;
-(void)clearText:(id)args;
-(id)getData:(id)args;
-(NSString *)getText:(id)args;
-(BOOL)hasData:(id)args;
-(BOOL)hasText:(id)args;
-(void)setData:(id)args;
-(void)setText:(id)args;

@end
