/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBreakpointHandler.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiRootViewController.h"
#import "TiUtils.h"
#import "TiViewProxy.h"

static NSString *const kBreakpointMinWidth = @"minWidth";
static NSString *const kBreakpointMaxWidth = @"maxWidth";
static NSString *const kBreakpointMinHeight = @"minHeight";
static NSString *const kBreakpointMaxHeight = @"maxHeight";
static NSString *const kBreakpointProperties = @"properties";
static NSString *const kBreakpointsKey = @"breakpoints";

@interface TiBreakpoint : NSObject {
  @public
  CGFloat minWidth;
  CGFloat maxWidth;
  CGFloat minHeight;
  CGFloat maxHeight;
  NSDictionary *properties;
}
- (BOOL)matchesSize:(CGSize)size;
@end

@implementation TiBreakpoint

- (instancetype)init
{
  if (self = [super init]) {
    minWidth = -CGFLOAT_MAX;
    maxWidth = CGFLOAT_MAX;
    minHeight = -CGFLOAT_MAX;
    maxHeight = CGFLOAT_MAX;
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(properties);
  [super dealloc];
}

- (BOOL)matchesSize:(CGSize)size
{
  return (size.width >= minWidth) && (size.width <= maxWidth) && (size.height >= minHeight) && (size.height <= maxHeight);
}

@end

@implementation TiBreakpointHandler

- (instancetype)initWithProxy:(TiViewProxy *)viewProxy
{
  if (self = [super init]) {
    proxy = viewProxy;
    breakpoints = [[NSMutableArray alloc] init];
    managedKeys = [[NSMutableOrderedSet alloc] init];
    baseValues = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)dealloc
{
  [self stopObserving];
  proxy = nil;
  RELEASE_TO_NIL(breakpoints);
  RELEASE_TO_NIL(managedKeys);
  RELEASE_TO_NIL(baseValues);
  RELEASE_TO_NIL(lastMatches);
  [super dealloc];
}

#pragma mark Public

- (void)setBreakpoints:(id)value
{
  // All evaluation runs on the main thread, like the window size notifications.
  TiThreadPerformOnMainThread(
      ^{
        [self replaceBreakpointsWithValue:value];
      },
      YES);
}

- (void)replaceBreakpointsWithValue:(id)value
{
  // Restore the original values before switching to the new rules.
  [self applyValues:baseValues];
  [breakpoints removeAllObjects];
  [managedKeys removeAllObjects];
  [baseValues removeAllObjects];
  RELEASE_TO_NIL(lastMatches);

  if ([value isKindOfClass:[NSArray class]]) {
    for (id item in (NSArray *)value) {
      TiBreakpoint *breakpoint = [self parseBreakpoint:item];
      if (breakpoint != nil) {
        [breakpoints addObject:breakpoint];
        [managedKeys addObjectsFromArray:[breakpoint->properties allKeys]];
      }
    }
  } else if ((value != nil) && (value != [NSNull null])) {
    DebugLog(@"[WARN] Property '%@' must be an array.", kBreakpointsKey);
  }

  if ([breakpoints count] == 0) {
    [self stopObserving];
    return;
  }

  // The values set so far are the originals that are restored when no breakpoint matches.
  for (NSString *key in managedKeys) {
    [baseValues setObject:[self currentValueForKey:key] forKey:key];
  }

  [self startObserving];
  [self updateWithSize:[self windowSize]];
}

- (void)noteValueChangedForKey:(NSString *)key
{
  if (![NSThread isMainThread]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self noteValueChangedForKey:key];
    });
    return;
  }
  if (applying || (proxy == nil) || ![managedKeys containsObject:key]) {
    return;
  }
  // Assigned from JavaScript: this is the new original value of the property.
  [baseValues setObject:[self currentValueForKey:key] forKey:key];
}

- (void)invalidate
{
  [self stopObserving];
  // The proxy is destroyed on its own queue. Keep pending main thread evaluations from touching it.
  proxy = nil;
}

#pragma mark Window size

- (CGSize)windowSize
{
  TiRootViewController *controller = [[TiApp app] controller];
  if (![controller isViewLoaded]) {
    // Do not force the root view to load. The first layout posts kTiWindowSizeChanged.
    return CGSizeZero;
  }
  UIView *hostingView = [controller hostingView];
  if (hostingView == nil) {
    hostingView = [controller view];
  }
  return hostingView.bounds.size;
}

- (void)windowSizeChanged:(NSNotification *)notification
{
  NSValue *sizeValue = [[notification userInfo] objectForKey:@"size"];
  CGSize size = (sizeValue != nil) ? [sizeValue CGSizeValue] : [self windowSize];
  [self updateWithSize:size];
}

- (void)startObserving
{
  if (observing) {
    return;
  }
  observing = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(windowSizeChanged:)
                                               name:kTiWindowSizeChanged
                                             object:nil];
}

- (void)stopObserving
{
  if (!observing) {
    return;
  }
  observing = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiWindowSizeChanged object:nil];
}

#pragma mark Evaluation

- (void)updateWithSize:(CGSize)size
{
  if ((proxy == nil) || (size.width <= 0) || (size.height <= 0)) {
    return;
  }

  // Do nothing if the same breakpoints match as before.
  NSMutableArray *matches = [NSMutableArray array];
  for (NSUInteger index = 0; index < [breakpoints count]; index++) {
    if ([[breakpoints objectAtIndex:index] matchesSize:size]) {
      [matches addObject:@(index)];
    }
  }
  if ((lastMatches != nil) && [matches isEqualToArray:lastMatches]) {
    return;
  }
  RELEASE_TO_NIL(lastMatches);
  lastMatches = [matches copy];

  // Merge original values with the properties of all matching breakpoints. Last one wins.
  NSMutableDictionary *targetValues = [NSMutableDictionary dictionaryWithDictionary:baseValues];
  for (NSNumber *index in matches) {
    TiBreakpoint *breakpoint = [breakpoints objectAtIndex:[index unsignedIntegerValue]];
    [targetValues addEntriesFromDictionary:breakpoint->properties];
  }
  [self applyValues:targetValues];
}

- (void)applyValues:(NSDictionary *)values
{
  if (proxy == nil) {
    return;
  }
  applying = YES;
  for (NSString *key in values) {
    id value = [values objectForKey:key];
    if (![[self currentValueForKey:key] isEqual:value]) {
      [self applyValue:value forKey:key];
    }
  }
  applying = NO;
}

/**
 Returns the stored property value of the proxy. Returns NSNull when the property is not set,
 so the value can be stored in a dictionary and compared with isEqual:.
 */
- (id)currentValueForKey:(NSString *)key
{
  id value = [proxy valueForUndefinedKey:key];
  return (value == nil) ? [NSNull null] : value;
}

/**
 Applies a value the same way a JavaScript assignment does. See KrollObject setValue:forKey:.
 */
- (void)applyValue:(id)value forKey:(NSString *)key
{
  if (value == [NSNull null]) {
    value = nil;
  }
  NSString *name = [[[key substringToIndex:1] uppercaseString] stringByAppendingString:[key substringFromIndex:1]];
  SEL selectorWithObject = NSSelectorFromString([NSString stringWithFormat:@"set%@:withObject:", name]);
  if ([proxy respondsToSelector:selectorWithObject]) {
    [proxy performSelector:selectorWithObject withObject:value withObject:nil];
    return;
  }
  SEL selector = NSSelectorFromString([NSString stringWithFormat:@"set%@:", name]);
  if ([proxy respondsToSelector:selector] && ![name isEqualToString:@"ZIndex"]) {
    [proxy performSelector:selector withObject:value];
    return;
  }
  [proxy setValue:value forKey:key];
}

#pragma mark Parsing

- (TiBreakpoint *)parseBreakpoint:(id)item
{
  if (![item isKindOfClass:[NSDictionary class]]) {
    DebugLog(@"[WARN] Each breakpoint must be a dictionary.");
    return nil;
  }
  NSDictionary *dict = (NSDictionary *)item;
  id properties = [dict objectForKey:kBreakpointProperties];
  if (![properties isKindOfClass:[NSDictionary class]]) {
    DebugLog(@"[WARN] Breakpoint is missing the '%@' dictionary.", kBreakpointProperties);
    return nil;
  }

  TiBreakpoint *breakpoint = [[[TiBreakpoint alloc] init] autorelease];
  breakpoint->minWidth = [TiUtils floatValue:[dict objectForKey:kBreakpointMinWidth] def:-CGFLOAT_MAX];
  breakpoint->maxWidth = [TiUtils floatValue:[dict objectForKey:kBreakpointMaxWidth] def:CGFLOAT_MAX];
  breakpoint->minHeight = [TiUtils floatValue:[dict objectForKey:kBreakpointMinHeight] def:-CGFLOAT_MAX];
  breakpoint->maxHeight = [TiUtils floatValue:[dict objectForKey:kBreakpointMaxHeight] def:CGFLOAT_MAX];

  NSMutableDictionary *filtered = [NSMutableDictionary dictionaryWithCapacity:[properties count]];
  for (id key in (NSDictionary *)properties) {
    if ([key isKindOfClass:[NSString class]] && ![key isEqualToString:kBreakpointsKey]) {
      [filtered setObject:[properties objectForKey:key] forKey:key];
    }
  }
  breakpoint->properties = [filtered copy];
  return breakpoint;
}

@end
