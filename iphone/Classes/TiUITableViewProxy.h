/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"
#import "TiUITableViewBase.h"

@interface TiUITableViewProxy : TiViewProxy 
{
}

#pragma mark Internal

-(void)enqueueAction:(id)args withType:(TiUITableViewDispatchType)type;

#pragma mark Public APIs

- (void) insertRowAfter:(NSArray *)args;
- (void) insertRowBefore:(NSArray *)args;
- (void) deleteRow:(NSArray *)args;
- (void) updateRow:(NSArray *)args;
- (void) appendRow:(NSArray *)args;
- (void) scrollToIndex:(NSArray *)args;

- (void) setEditing:(NSNumber*)edit withObject:(id)obj;
- (void) setMoving:(NSNumber*)edit withObject:(id)obj;

@end
