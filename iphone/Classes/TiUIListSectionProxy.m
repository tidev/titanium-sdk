/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListSectionProxy.h"
#import "TiUIListItem.h"
#import "TiUIListView.h"
#import "TiUIListViewProxy.h"

@interface TiUIListSectionProxy ()
@property (nonatomic, readonly) id<TiUIListViewDelegate> dispatcher;
@end

@implementation TiUIListSectionProxy {
  NSMutableArray *_items;
}

@synthesize delegate = _delegate;
@synthesize sectionIndex = _sectionIndex;
@synthesize headerTitle = _headerTitle;
@synthesize footerTitle = _footerTitle;

- (id)init
{
  self = [super init];
  if (self) {
    _items = [[NSMutableArray alloc] initWithCapacity:20];
  }
  return self;
}

- (void)dealloc
{
  _delegate = nil;
  [_items release];
  [_headerTitle release];
  [_footerTitle release];
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.ListSection";
}

- (id<TiUIListViewDelegate>)dispatcher
{
  return _delegate != nil ? _delegate : self;
}

// These API's are used by the ListView directly. Not for public consumption
- (NSDictionary *)itemAtIndex:(NSUInteger)index
{
  if (index < [_items count]) {
    id item = [_items objectAtIndex:index];
    if ([item isKindOfClass:[NSDictionary class]]) {
      return item;
    }
  }
  return nil;
}

- (void)deleteItemAtIndex:(NSUInteger)index
{
  if ([_items count] <= index) {
    DebugLog(@"[WARN] ListSectionProxy: deleteItemAtIndex index is out of range");
  } else {
    [_items removeObjectAtIndex:index];
  }
}

- (void)addItem:(NSDictionary *)item atIndex:(NSUInteger)index
{
  if (index > [_items count]) {
    DebugLog(@"[WARN] ListSectionProxy: addItem:atIndex: index is out of range");
  } else {
    if (index == [_items count]) {
      [_items addObject:item];
    } else {
      [_items insertObject:item atIndex:index];
    }
  }
}

#pragma mark - Public API

- (NSArray *)items
{
  return [self.dispatcher dispatchBlockWithResult:^() {
    return [[_items copy] autorelease];
  }];
}

- (NSUInteger)itemCount
{
  return [[self.dispatcher dispatchBlockWithResult:^() {
    return [NSNumber numberWithUnsignedInteger:[_items count]];
  }] unsignedIntegerValue];
}

- (id)getItemAt:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSUInteger itemIndex = [TiUtils intValue:[args objectAtIndex:0]];
  return [self.dispatcher dispatchBlockWithResult:^() {
    return (itemIndex < [_items count]) ? [_items objectAtIndex:itemIndex] : nil;
  }];
}

- (void)setItems:(id)args
{
  [self setItems:args withObject:[NSDictionary dictionaryWithObject:NUMINT(UITableViewRowAnimationNone) forKey:@"animationStyle"]];
}

- (void)setItems:(id)args withObject:(id)properties
{
  ENSURE_TYPE_OR_NIL(args, NSArray);
  NSArray *items = args;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      [_items setArray:items];
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        [theDelegate updateSearchResults:nil];
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      [_items setArray:items];
      [tableView reloadSections:[NSIndexSet indexSetWithIndex:_sectionIndex] withRowAnimation:animation];
    }];
  }
}

- (void)appendItems:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSArray *items = [args objectAtIndex:0];
  if ([items count] == 0) {
    return;
  }
  ENSURE_TYPE_OR_NIL(items, NSArray);
  NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : nil;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      [_items addObjectsFromArray:items];
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        TiThreadPerformOnMainThread(^{
          [theDelegate updateSearchResults:nil];
        },
            NO);
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      NSUInteger insertIndex = [_items count];
      [_items addObjectsFromArray:items];
      NSUInteger count = [items count];
      NSMutableArray *indexPaths = [[NSMutableArray alloc] initWithCapacity:count];
      for (NSUInteger i = 0; i < count; ++i) {
        [indexPaths addObject:[NSIndexPath indexPathForRow:insertIndex + i inSection:_sectionIndex]];
      }
      [tableView insertRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      [indexPaths release];
    }];
  }
}

- (void)insertItemsAt:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSUInteger insertIndex = [TiUtils intValue:[args objectAtIndex:0]];
  NSArray *items = [args objectAtIndex:1];
  if ([items count] == 0) {
    return;
  }
  ENSURE_TYPE_OR_NIL(items, NSArray);
  NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      if ([_items count] < insertIndex) {
        DebugLog(@"[WARN] ListView: Insert item index is out of range");
        return;
      }
      [_items replaceObjectsInRange:NSMakeRange(insertIndex, 0) withObjectsFromArray:items];
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        [theDelegate updateSearchResults:nil];
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      if ([_items count] < insertIndex) {
        DebugLog(@"[WARN] ListView: Insert item index is out of range");
        return;
      }
      [_items replaceObjectsInRange:NSMakeRange(insertIndex, 0) withObjectsFromArray:items];
      NSUInteger count = [items count];
      NSMutableArray *indexPaths = [[NSMutableArray alloc] initWithCapacity:count];
      for (NSUInteger i = 0; i < count; ++i) {
        [indexPaths addObject:[NSIndexPath indexPathForRow:insertIndex + i inSection:_sectionIndex]];
      }
      [tableView insertRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      [indexPaths release];
    }];
  }
}

- (void)replaceItemsAt:(id)args
{
  ENSURE_ARG_COUNT(args, 3);
  NSUInteger insertIndex = [TiUtils intValue:[args objectAtIndex:0]];
  NSUInteger replaceCount = [TiUtils intValue:[args objectAtIndex:1]];
  NSArray *items = [args objectAtIndex:2];
  ENSURE_TYPE_OR_NIL(items, NSArray);
  NSDictionary *properties = [args count] > 3 ? [args objectAtIndex:3] : nil;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      if ([_items count] < insertIndex) {
        DebugLog(@"[WARN] ListView: Replace item index is out of range");
        return;
      }
      NSUInteger actualReplaceCount = MIN(replaceCount, [_items count] - insertIndex);
      [_items replaceObjectsInRange:NSMakeRange(insertIndex, actualReplaceCount) withObjectsFromArray:items];
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        [theDelegate updateSearchResults:nil];
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      if ([_items count] < insertIndex) {
        DebugLog(@"[WARN] ListView: Replace item index is out of range");
        return;
      }
      NSUInteger actualReplaceCount = MIN(replaceCount, [_items count] - insertIndex);
      [_items replaceObjectsInRange:NSMakeRange(insertIndex, actualReplaceCount) withObjectsFromArray:items];
      NSUInteger count = [items count];
      NSMutableArray *indexPaths = [[NSMutableArray alloc] initWithCapacity:MAX(count, actualReplaceCount)];
      for (NSUInteger i = 0; i < actualReplaceCount; ++i) {
        [indexPaths addObject:[NSIndexPath indexPathForRow:insertIndex + i inSection:_sectionIndex]];
      }
      if (actualReplaceCount > 0) {
        [tableView deleteRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      }
      [indexPaths removeAllObjects];
      for (NSUInteger i = 0; i < count; ++i) {
        [indexPaths addObject:[NSIndexPath indexPathForRow:insertIndex + i inSection:_sectionIndex]];
      }
      if (count > 0) {
        [tableView insertRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      }
      [indexPaths release];
    }];
  }
}

- (void)deleteItemsAt:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSUInteger deleteIndex = [TiUtils intValue:[args objectAtIndex:0]];
  NSUInteger deleteCount = [TiUtils intValue:[args objectAtIndex:1]];
  if (deleteCount == 0) {
    return;
  }
  NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      if ([_items count] <= deleteIndex) {
        DebugLog(@"[WARN] ListView: Delete item index is out of range");
        return;
      }
      NSUInteger actualDeleteCount = MIN(deleteCount, [_items count] - deleteIndex);
      if (actualDeleteCount == 0) {
        return;
      }
      [_items removeObjectsInRange:NSMakeRange(deleteIndex, actualDeleteCount)];
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        [theDelegate updateSearchResults:nil];
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      if ([_items count] <= deleteIndex) {
        DebugLog(@"[WARN] ListView: Delete item index is out of range");
        return;
      }
      NSUInteger actualDeleteCount = MIN(deleteCount, [_items count] - deleteIndex);
      if (actualDeleteCount == 0) {
        return;
      }
      [_items removeObjectsInRange:NSMakeRange(deleteIndex, actualDeleteCount)];
      NSMutableArray *indexPaths = [[NSMutableArray alloc] initWithCapacity:actualDeleteCount];
      for (NSUInteger i = 0; i < actualDeleteCount; ++i) {
        [indexPaths addObject:[NSIndexPath indexPathForRow:deleteIndex + i inSection:_sectionIndex]];
      }
      [tableView deleteRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      [indexPaths release];
    }];
  }
}

- (void)updateItemAt:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSUInteger itemIndex = [TiUtils intValue:[args objectAtIndex:0]];
  NSDictionary *item = [args objectAtIndex:1];
  ENSURE_TYPE_OR_NIL(item, NSDictionary);
  NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
  UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
  id<TiUIListViewDelegate> theDispatcher = self.dispatcher;

  if (animation == UITableViewRowAnimationNone) {
    [theDispatcher dispatchBlock:^(UITableView *tableView) {
      if ([_items count] <= itemIndex) {
        DebugLog(@"[WARN] ListView: Update item index is out of range");
        return;
      }
      if (item != nil) {
        [_items replaceObjectAtIndex:itemIndex withObject:item];
      }
      id<TiUIListViewDelegateView> theDelegate = [theDispatcher delegateView];
      if (theDelegate != nil) {
        [theDelegate updateSearchResults:nil];
        if ([theDispatcher isKindOfClass:[TiViewProxy class]]) {
          [(TiViewProxy *)theDispatcher contentsWillChange];
        }
      }
    }];
  } else {
    [theDispatcher dispatchUpdateAction:^(UITableView *tableView) {
      if ([_items count] <= itemIndex) {
        DebugLog(@"[WARN] ListView: Update item index is out of range");
        return;
      }
      if (item != nil) {
        [_items replaceObjectAtIndex:itemIndex withObject:item];
      }
      NSArray *indexPaths = [[NSArray alloc] initWithObjects:[NSIndexPath indexPathForRow:itemIndex inSection:_sectionIndex], nil];
      [tableView reloadRowsAtIndexPaths:indexPaths withRowAnimation:animation];
      [indexPaths release];
    }];
  }
}

#pragma mark - TiUIListViewDelegate

- (void)dispatchUpdateAction:(void (^)(UITableView *))block
{
  block(nil);
}

- (void)dispatchBlock:(void (^)(UITableView *tableView))block
{
  block(nil);
}

- (id)dispatchBlockWithResult:(id (^)(void))block
{
  return block();
}

- (id<TiUIListViewDelegateView>)delegateView
{
  return nil;
}
@end

#endif
