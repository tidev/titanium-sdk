/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@class TiViewProxy;

/**
 Applies the "breakpoints" property of a view, similar to CSS media queries.

 Each breakpoint defines optional "minWidth", "maxWidth", "minHeight" and "maxHeight" values
 in points which are compared against the size of the app window. The "properties" of all
 matching breakpoints are applied to the view proxy in array order. When a breakpoint no longer
 matches, the view's original property values are restored.

 A value assigned from JavaScript while a breakpoint is active is kept until the set of matching
 breakpoints changes, and becomes the new original value that is restored afterwards.

 All methods except `invalidate` must be called on the main thread.
 */
@interface TiBreakpointHandler : NSObject {
  @private
  TiViewProxy *proxy; // Not retained. The proxy owns the handler.
  NSMutableArray *breakpoints;
  NSMutableOrderedSet *managedKeys;
  NSMutableDictionary *baseValues;
  NSArray *lastMatches;
  BOOL observing;
  BOOL applying;
}

/**
 Creates a handler for the given view proxy.
 @param viewProxy The proxy whose properties the handler changes. Not retained.
 */
- (instancetype)initWithProxy:(TiViewProxy *)viewProxy;

/**
 Replaces the current breakpoints with the given ones and applies them.
 @param value The "breakpoints" property value. Expected to be an array of dictionaries.
 */
- (void)setBreakpoints:(id)value;

/**
 Tells the handler that a property of the proxy was stored. Values stored while the handler
 itself applies a breakpoint are ignored, any other value becomes the property's original value.
 @param key The property name.
 */
- (void)noteValueChangedForKey:(NSString *)key;

/**
 Stops listening to window size changes and detaches from the proxy. To be called when the
 proxy is destroyed. Safe to call from any thread.
 */
- (void)invalidate;

@end
