/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListItemProxy.h"
#import "TiUIListItem.h"
#import "TiUIListViewProxy.h"
#import <TitaniumKit/TiUtils.h>

static void SetEventOverrideDelegateRecursive(NSArray *children, id<TiViewEventOverrideDelegate> eventOverrideDelegate);

@implementation TiUIListItemProxy {
  TiUIListViewProxy *_listViewProxy; // weak
}

@synthesize listItem = _listItem;
@synthesize indexPath = _indexPath;

- (id)initWithListViewProxy:(TiUIListViewProxy *)listViewProxy inContext:(id<TiEvaluator>)context
{
  self = [self _initWithPageContext:context];
  if (self) {
    _listViewProxy = listViewProxy;
    [context.krollContext invokeBlockOnThread:^{
      [context registerProxy:self];
      //Reusable cell will keep native proxy alive.
      //This proxy will keep its JS object alive.
      [self rememberSelf];
    }];
    self.modelDelegate = self;
  }
  return self;
}

+ (BOOL)shouldRegisterOnInit
{
  //Since this is initialized on main thread,
  //there is no need to register on init. Registration
  //done later on JS thread (See above)
  return NO;
}

- (void)deregisterProxy:(id<TiEvaluator>)context
{
  //Aggressive removal of children on deallocation of cell
  [self removeAllChildren:nil];
  [self windowDidClose];
  //Go ahead and unprotect JS object and mark context closed
  //(Since cell no longer exists, the proxy is inaccessible)
  [context.krollContext invokeBlockOnThread:^{
    [self forgetSelf];
    [self contextShutdown:context];
  }];
}

- (NSString *)apiName
{
  return @"Ti.UI.ListItem";
}

- (id)init
{
  self = [super init];
  if (self) {
    viewInitialized = YES;
    [self windowWillOpen];
    [self windowDidOpen];
    [self willShow];
  }
  return self;
}

- (void)dealloc
{
  [_indexPath release];
  [super dealloc];
}

- (TiUIView *)view
{
  return nil;
}

- (BOOL)viewAttached
{
  return _listItem != nil;
}

- (UIView *)parentViewForChild:(TiViewProxy *)child
{
  return _listItem.contentView;
}

- (void)propertyChanged:(NSString *)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy *)proxy_
{
  if ([key isEqualToString:@"accessoryType"]) {
    TiThreadPerformOnMainThread(^{
      _listItem.accessoryType = [TiUtils intValue:newValue def:UITableViewCellAccessoryNone];
    },
        YES);
  } else if ([key isEqualToString:@"selectionStyle"]) {
    TiThreadPerformOnMainThread(^{
      _listItem.selectionStyle = [TiUtils intValue:newValue def:UITableViewCellSelectionStyleBlue];
    },
        YES);
  }
}

- (void)unarchiveFromTemplate:(id)viewTemplate
{
  [super unarchiveFromTemplate:viewTemplate];
  SetEventOverrideDelegateRecursive(self.children, self);
}

- (BOOL)canHaveControllerParent
{
  return NO;
}

#pragma mark - TiViewEventOverrideDelegate

- (NSDictionary *)overrideEventObject:(NSDictionary *)eventObject forEvent:(NSString *)eventType fromViewProxy:(TiViewProxy *)viewProxy
{
  NSMutableDictionary *updatedEventObject = [eventObject mutableCopy];
  [updatedEventObject setObject:NUMINTEGER(_indexPath.section) forKey:@"sectionIndex"];
  [updatedEventObject setObject:NUMINTEGER(_indexPath.row) forKey:@"itemIndex"];
  [updatedEventObject setObject:[_listViewProxy sectionForIndex:_indexPath.section] forKey:@"section"];
  id propertiesValue = [_listItem.dataItem objectForKey:@"properties"];
  NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
  id itemId = [properties objectForKey:@"itemId"];
  if (itemId != nil) {
    [updatedEventObject setObject:itemId forKey:@"itemId"];
  }
  id bindId = [viewProxy valueForKey:@"bindId"];
  if (bindId != nil) {
    [updatedEventObject setObject:bindId forKey:@"bindId"];
  }
  return [updatedEventObject autorelease];
}

@end

static void SetEventOverrideDelegateRecursive(NSArray *children, id<TiViewEventOverrideDelegate> eventOverrideDelegate)
{
  [children enumerateObjectsUsingBlock:^(TiViewProxy *child, NSUInteger idx, BOOL *stop) {
    child.eventOverrideDelegate = eventOverrideDelegate;
    SetEventOverrideDelegateRecursive(child.children, eventOverrideDelegate);
  }];
}

#endif
