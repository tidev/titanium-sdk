/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITabbedBar.h"
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/Webcolor.h>

@implementation TiUITabbedBar

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoSize];
}
#endif

- (id)init
{
  self = [super init];
  if (self != nil) {
    selectedIndex = -1;
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(tabBar);
  [super dealloc];
}

- (BOOL)hasTouchableListener
{
  // since this guy only works with touch events, we always want them
  // just always return YES no matter what listeners we have registered
  return YES;
}

- (UITabBar *)tabBar
{
  if (tabBar == nil) {
    CGRect ourBoundsRect = [self bounds];
    tabBar = [[UITabBar alloc] initWithFrame:ourBoundsRect];
    [tabBar setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
    [tabBar setDelegate:self];
    [self addSubview:tabBar];
  }
  return tabBar;
}

#pragma mark UITabBarDelegate methods

- (void)tabBar:(UITabBar *)tabBar didSelectItem:(UITabBarItem *)item
{
  // Fetch the index of the selected tab.
  NSInteger newIndex = [[self tabBar].items indexOfObject:item];

  // Update the proxy's "index" property. (This is in case the property didn't exist to begine with.)
  [self.proxy replaceValue:NUMINTEGER(newIndex) forKey:@"index" notification:NO];

  // Do not continue if selection hasn't changed.
  if (newIndex == selectedIndex) {
    return;
  }

  // Store current selection.
  selectedIndex = newIndex;

  // Fire a "click" event.
  if ([self.proxy _hasListeners:@"click"]) {
    NSDictionary *event = [NSDictionary dictionaryWithObject:NUMINTEGER(newIndex) forKey:@"index"];
    [self.proxy fireEvent:@"click" withObject:event];
  }
}

- (id)accessibilityElement
{
  return [self tabBar];
}

- (void)setTintColor_:(id)value
{
  UIColor *color = [[TiUtils colorValue:value] color];
  [[self tabBar] setTintColor:color];
}

- (void)setBackgroundColor_:(id)value
{
  UIColor *color = [[TiUtils colorValue:value] color];
  [[self tabBar] setBarTintColor:color];
}

- (void)setIndex_:(id)value
{
  // Fetch given index and make sure it's within bounds.
  // Note: Only allow index of -1 if no tabs exist. A tab must always be selected.
  NSInteger givenIndex = [TiUtils intValue:value def:-1];
  NSInteger tabCount = [self tabBar].items.count;
  if (tabCount > 0) {
    selectedIndex = MIN(givenIndex, (tabCount - 1));
    selectedIndex = MAX(selectedIndex, 0);
  } else {
    selectedIndex = -1;
  }

  // If above applied a floor/ceiling to index, then update property.
  if ((selectedIndex != givenIndex) || ([self.proxy valueForKey:@"index"] == nil)) {
    [self.proxy replaceValue:@(selectedIndex) forKey:@"index" notification:NO];
  }

  // Select the tab.
  if (selectedIndex >= 0) {
    tabBar.selectedItem = tabBar.items[selectedIndex];
  }
}

- (void)setStyle_:(id)value
{
  DebugLog(@"[WARN] The style property has been deprecated in 3.4.2 and no longer has any effect");
}

- (void)setLabels_:(id)value
{
  // Create the TabBar, if not done already.
  [self tabBar];

  // Remove all tabs if given a null/empty array.
  if (IS_NULL_OR_NIL(value)) {
    [tabBar setItems:@[] animated:NO];
    selectedIndex = -1;
    return;
  }

  // Create a tab for each "Ti.UI.BarItemType" object in the given array.
  ENSURE_ARRAY(value);
  NSMutableArray *itemsArray = [[NSMutableArray alloc] init];
  for (id nextEntry in value) {
    UITabBarItem *tabItem = [[UITabBarItem alloc] init];
    if ([nextEntry isKindOfClass:[NSDictionary class]]) {
      tabItem.title = [TiUtils stringValue:@"title" properties:nextEntry];
      tabItem.image = [TiUtils image:[nextEntry objectForKey:@"image"] proxy:[self proxy]];
      tabItem.enabled = [TiUtils boolValue:@"enabled" properties:nextEntry def:YES];
      tabItem.accessibilityLabel = [TiUtils stringValue:@"accessibilityLabel" properties:nextEntry];
    } else if ([nextEntry isKindOfClass:[NSString class]]) {
      tabItem.title = [TiUtils stringValue:nextEntry];
    }
    [itemsArray addObject:tabItem];
    [tabItem release];
  }
  [tabBar setItems:itemsArray animated:YES];
  [itemsArray release];

  // Restore the last tab selection if possible.
  NSInteger index = [TiUtils intValue:[self.proxy valueForUndefinedKey:@"index"] def:(int)selectedIndex];
  [self setIndex_:@(index)];
}

- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  return value;
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  return [[self tabBar] sizeThatFits:CGSizeMake(value, 0)].height;
}

@end
