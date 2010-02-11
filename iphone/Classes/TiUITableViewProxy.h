/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITableViewBase.h"
#import "TiUITableViewRowProxy.h"

@interface TiUITableViewProxy : TiViewProxy<TiUITableViewRowParent> 
{
	NSMutableArray * data;
}

//Because the proxy is divorced from the view, we can update this synchronously, and queue up the proper response.

#pragma mark Internal

-(void)enqueueAction:(id)args withType:(TiUITableViewDispatchType)type;

#pragma mark Public APIs

@property(nonatomic,readwrite,copy)	NSArray * data;

- (void) insertRowAfter:(NSArray *)args;
- (void) insertRowBefore:(NSArray *)args;
- (void) deleteRow:(NSArray *)args;
- (void) updateRow:(NSArray *)args;
- (void) addRow:(NSArray *)args;
- (void) scrollToIndex:(NSArray *)args;

- (void) setEditing:(NSNumber*)edit withObject:(id)obj;
- (void) setMoving:(NSNumber*)edit withObject:(id)obj;

@end
