/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiUIPickerColumnProxy : TiProxy {
@private
	NSMutableArray *rows;
	NSInteger column;
}

@property(nonatomic,readonly) NSMutableArray *rows;
@property(nonatomic,readonly) NSInteger rowCount;
@property(nonatomic,readwrite,assign) NSInteger column;

-(void)addRow:(id)row;
-(void)removeRow:(id)row;
-(id)rowAt:(NSInteger)row;

@end
