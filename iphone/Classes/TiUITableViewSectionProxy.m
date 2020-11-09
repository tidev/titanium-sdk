/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUITableViewSectionProxy.h"
#import "TiUITableView.h"
#import "TiUITableViewAction.h"
#import "TiUITableViewRowProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUITableViewSectionProxy

@synthesize rows, table, section;

#pragma mark Internal

- (void)_destroy
{
  self.modelDelegate = nil;
  for (TiUITableViewRowProxy *thisRow in rows) {
    if ([thisRow parent] == self) {
      [thisRow setParent:nil];
      [thisRow setSection:nil];
    }
  }
  RELEASE_TO_NIL(rows);
  [super _destroy];
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [super _initWithProperties:properties];
  self.modelDelegate = self;
}

- (NSString *)apiName
{
  return @"Ti.UI.TableViewSection";
}

- (void)reorderRows
{
  NSInteger index = 0;
  for (TiUITableViewRowProxy *row in rows) {
    row.row = index++;
  }
}

- (void)triggerSectionUpdate
{
  TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:self animation:nil type:TiUITableViewActionSectionReload] autorelease];
  [table dispatchAction:action];
}

- (void)setTable:(TiUITableView *)newTable
{
  table = newTable;
  for (TiUITableViewRowProxy *thisRow in rows) {
    [thisRow setTable:newTable];
  }
}

#pragma mark Public APIs

- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state objects:(id *)stackbuf count:(NSUInteger)len;
{
  return [rows countByEnumeratingWithState:state objects:stackbuf count:len];
}

- (NSNumber *)rowCount
{
  return NUMUINTEGER((rows != nil) ? rows.count : 0);
}

- (void)add:(id)proxy
{
  ENSURE_SINGLE_ARG(proxy, TiUITableViewRowProxy);
  [self rememberProxy:proxy];
  [(TiUITableViewRowProxy *)proxy setSection:self];
  if (rows == nil) {
    rows = [[NSMutableArray array] retain];
  }
  [rows addObject:proxy];
}

- (void)remove:(id)proxy
{
  ENSURE_SINGLE_ARG(proxy, TiUITableViewRowProxy);
  [self forgetProxy:proxy];
  [(TiUITableViewRowProxy *)proxy setSection:nil];
  if (rows != nil) {
    [rows removeObject:proxy];
  }
}

- (UIView *)view
{
  return nil;
}

- (TiUITableViewRowProxy *)rowAtIndex:(NSUInteger)index
{
  //Because rowAtIndex is used internally, with an int, it can't be used by the Javascript.
  //The javascript passes in an NSArray pointer, not an index. And things blow up.
  return [rows objectAtIndex:index];
}

- (NSString *)headerTitle
{
  return [TiUtils stringValue:[super valueForUndefinedKey:@"headerTitle"]];
}

- (NSString *)footerTitle
{
  return [TiUtils stringValue:[super valueForUndefinedKey:@"footerTitle"]];
}

#pragma mark Delegate

- (void)propertyChanged:(NSString *)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy *)proxy
{
  // these properties should trigger a re-paint for the row
  static NSSet *TableViewSectionProperties = nil;
  if (TableViewSectionProperties == nil) {
    TableViewSectionProperties = [[NSSet alloc] initWithObjects:
                                                    @"headerTitle", @"footerTitle",
                                                @"headerView", @"footerView",
                                                nil];
  }

  if ([TableViewSectionProperties member:key] != nil && table != nil) {
    [self triggerSectionUpdate];
  }
}

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif
@end

#endif
