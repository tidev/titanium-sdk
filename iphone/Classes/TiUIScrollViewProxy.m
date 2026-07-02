/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIScrollViewProxy.h"
#import "TiUIScrollView.h"

#import <TitaniumKit/TiUtils.h>

@implementation TiUIScrollViewProxy

static NSArray *scrollViewKeySequence;
- (NSArray *)keySequence
{
  if (scrollViewKeySequence == nil) {
    // URL has to be processed first since the spinner depends on URL being remote
    scrollViewKeySequence = [[NSArray arrayWithObjects:@"minZoomScale", @"maxZoomScale", @"zoomScale", nil] retain];
  }
  return scrollViewKeySequence;
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"minZoomScale" defaultValue:NUMFLOAT(1.0)];
  [self initializeProperty:@"maxZoomScale" defaultValue:NUMFLOAT(1.0)];
  [self initializeProperty:@"zoomScale" defaultValue:NUMFLOAT(1.0)];
  [self initializeProperty:@"canCancelEvents" defaultValue:NUMBOOL(YES)];
  [self initializeProperty:@"scrollingEnabled" defaultValue:NUMBOOL(YES)];
  [self initializeProperty:@"contentInsets" defaultValue:nil];
  [self initializeProperty:@"verticalScrollIndicatorInsets" defaultValue:nil];
  [self initializeProperty:@"horizontalScrollIndicatorInsets" defaultValue:nil];
  [self initializeProperty:@"scrollIndicatorColor" defaultValue:nil];
  [super _initWithProperties:properties];
}

- (NSString *)apiName
{
  return @"Ti.UI.ScrollView";
}

- (TiPoint *)contentOffset
{
  if ([self viewAttached]) {
    TiThreadPerformOnMainThread(
        ^{
          contentOffset = [[TiPoint alloc] initWithPoint:CGPointMake(
                                                             [(TiUIScrollView *)[self view] scrollView].contentOffset.x,
                                                             [(TiUIScrollView *)[self view] scrollView].contentOffset.y)];
        },
        YES);
  } else {
    contentOffset = [[TiPoint alloc] initWithPoint:CGPointMake(0, 0)];
  }
  return [contentOffset autorelease];
}

- (id)contentInsets
{
  if ([self viewAttached]) {
    UIEdgeInsets insets = [(TiUIScrollView *)[self view] scrollView].contentInset;
    return @{
      @"top" : @(insets.top),
      @"left" : @(insets.left),
      @"bottom" : @(insets.bottom),
      @"right" : @(insets.right)
    };
  }
  return [NSNull null];
}

- (void)setContentInsets:(id)value
{
  ENSURE_UI_THREAD(setContentInsets, value);
  [self replaceValue:value forKey:@"contentInsets" notification:NO];
  if ([self viewAttached] && value != nil && ![value isEqual:[NSNull null]]) {
    UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];

    // Disable automatic content inset adjustment to allow manual values
    scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;

    // Extract insets and options from the same dictionary
    NSDictionary *insetsDict = value;
    BOOL animated = NO;
    CGFloat duration = 300; // default 300ms (matches TiUIListView/TiUITableView)
    CGFloat safeAreaOffset = 0;

    if ([value isKindOfClass:[NSDictionary class]]) {
      // Check for animation options
      id animVal = [value objectForKey:@"animated"];
      if (animVal != nil && ![animVal isEqual:[NSNull null]]) {
        animated = [TiUtils boolValue:animVal def:NO];
      }
      id durVal = [value objectForKey:@"duration"];
      if (durVal != nil && ![durVal isEqual:[NSNull null]]) {
        duration = [TiUtils doubleValue:durVal def:300];
      }
      id safeAreaVal = [value objectForKey:@"safearea"];
      if (safeAreaVal != nil && ![safeAreaVal isEqual:[NSNull null]]) {
        safeAreaOffset = [TiUtils doubleValue:safeAreaVal def:0];
      }

      // Extract insets from the same dictionary
      insetsDict = @{
        @"top" : value[@"top"],
        @"left" : value[@"left"],
        @"bottom" : value[@"bottom"],
        @"right" : value[@"right"]
      };
    }

    UIEdgeInsets insets = [TiUtils contentInsets:insetsDict];
    insets.bottom += safeAreaOffset;

    void (^updateInsets)(void) = ^{
      scrollView.contentInset = insets;
    };

    if (animated && duration > 0) {
      [UIView animateWithDuration:duration / 1000.0 animations:updateInsets];
    } else {
      updateInsets();
    }
  }
}

- (void)setVerticalScrollIndicatorInsets:(id)value
{
  ENSURE_UI_THREAD(setVerticalScrollIndicatorInsets, value);
  [self replaceValue:value forKey:@"verticalScrollIndicatorInsets" notification:NO];
  if ([self viewAttached] && value != nil && ![value isEqual:[NSNull null]]) {
    UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];

    // Disable automatic scroll indicator inset adjustment
    scrollView.automaticallyAdjustsScrollIndicatorInsets = NO;

    // Extract insets and options from the same dictionary
    NSDictionary *insetsDict = value;
    BOOL animated = NO;
    CGFloat duration = 300; // default 300ms (matches TiUIListView/TiUITableView)

    if ([value isKindOfClass:[NSDictionary class]]) {
      // Check for animation options
      id animVal = [value objectForKey:@"animated"];
      if (animVal != nil && ![animVal isEqual:[NSNull null]]) {
        animated = [TiUtils boolValue:animVal def:NO];
      }
      id durVal = [value objectForKey:@"duration"];
      if (durVal != nil && ![durVal isEqual:[NSNull null]]) {
        duration = [TiUtils doubleValue:durVal def:300];
      }
    }

    UIEdgeInsets insets = [TiUtils contentInsets:value];
    UIEdgeInsets current = scrollView.scrollIndicatorInsets;
    insets.top = current.top;
    insets.bottom = current.bottom;

    void (^updateInsets)(void) = ^{
      scrollView.scrollIndicatorInsets = insets;
    };

    if (animated && duration > 0) {
      [UIView animateWithDuration:duration / 1000.0 animations:updateInsets];
    } else {
      updateInsets();
    }
  }
}

- (void)setHorizontalScrollIndicatorInsets:(id)value
{
  ENSURE_UI_THREAD(setHorizontalScrollIndicatorInsets, value);
  [self replaceValue:value forKey:@"horizontalScrollIndicatorInsets" notification:NO];
  if ([self viewAttached] && value != nil && ![value isEqual:[NSNull null]]) {
    UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];

    // Disable automatic scroll indicator inset adjustment
    scrollView.automaticallyAdjustsScrollIndicatorInsets = NO;

    // Extract insets and options from the same dictionary
    NSDictionary *insetsDict = value;
    BOOL animated = NO;
    CGFloat duration = 300; // default 300ms (matches TiUIListView/TiUITableView)

    if ([value isKindOfClass:[NSDictionary class]]) {
      // Check for animation options
      id animVal = [value objectForKey:@"animated"];
      if (animVal != nil && ![animVal isEqual:[NSNull null]]) {
        animated = [TiUtils boolValue:animVal def:NO];
      }
      id durVal = [value objectForKey:@"duration"];
      if (durVal != nil && ![durVal isEqual:[NSNull null]]) {
        duration = [TiUtils doubleValue:durVal def:300];
      }
    }

    UIEdgeInsets insets = [TiUtils contentInsets:value];
    UIEdgeInsets current = scrollView.scrollIndicatorInsets;
    insets.left = current.left;
    insets.right = current.right;

    void (^updateInsets)(void) = ^{
      scrollView.scrollIndicatorInsets = insets;
    };

    if (animated && duration > 0) {
      [UIView animateWithDuration:duration / 1000.0 animations:updateInsets];
    } else {
      updateInsets();
    }
  }
}

- (id)verticalScrollIndicatorInsets
{
  if ([self viewAttached]) {
    UIEdgeInsets insets = [(TiUIScrollView *)[self view] scrollView].scrollIndicatorInsets;
    return @{
      @"top" : @(insets.top),
      @"left" : @(insets.left),
      @"bottom" : @(insets.bottom),
      @"right" : @(insets.right)
    };
  }
  return [NSNull null];
}

- (id)horizontalScrollIndicatorInsets
{
  if ([self viewAttached]) {
    UIEdgeInsets insets = [(TiUIScrollView *)[self view] scrollView].scrollIndicatorInsets;
    return @{
      @"top" : @(insets.top),
      @"left" : @(insets.left),
      @"bottom" : @(insets.bottom),
      @"right" : @(insets.right)
    };
  }
  return [NSNull null];
}

- (id)scrollIndicatorColor
{
  if ([self viewAttached]) {
    UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
    // Scroll indicator UIImageViews are direct subviews of UIScrollView
    for (UIView *subview in scrollView.subviews) {
      if ([subview isKindOfClass:[UIImageView class]]) {
        return [(UIImageView *)subview tintColor];
      }
    }
  }
  return [NSNull null];
}

- (void)setScrollIndicatorColor:(id)value
{
  ENSURE_UI_THREAD(setScrollIndicatorColor, value);
  [self replaceValue:value forKey:@"scrollIndicatorColor" notification:NO];
  if ([self viewAttached] && value != nil && ![value isEqual:[NSNull null]]) {
    UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
    UIColor *color = [[TiUtils colorValue:value] color];
    if (color == nil) {
      NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor: color is nil, returning");
      return;
    }

    // Force indicator recreation by toggling visibility
    scrollView.showsVerticalScrollIndicator = NO;
    scrollView.showsHorizontalScrollIndicator = NO;
    [scrollView setNeedsLayout];
    [scrollView layoutIfNeeded];

    scrollView.showsVerticalScrollIndicator = YES;
    scrollView.showsHorizontalScrollIndicator = YES;
    [scrollView setNeedsLayout];
    [scrollView layoutIfNeeded];

    // Apply color on next runloop to ensure indicators are fully created
    dispatch_async(dispatch_get_main_queue(), ^{
      UIScrollView *sv = [(TiUIScrollView *)[self view] scrollView];
      NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed applying to %lu subviews", (unsigned long)sv.subviews.count);
      for (UIView *subview in sv.subviews) {
        NSString *className = NSStringFromClass([subview class]);
        NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed subview: %@", className);
        if ([className isEqualToString:@"_UIScrollViewScrollIndicator"] || [subview isKindOfClass:[UIImageView class]]) {
          NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed found indicator: %@", className);
          if ([subview isKindOfClass:[UIImageView class]]) {
            UIImageView *imageView = (UIImageView *)subview;
            if (imageView.image != nil) {
              imageView.tintColor = color;
              imageView.image = [imageView.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
              NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed applied tint via UIImageView");
            }
          } else {
            subview.backgroundColor = color;
            subview.layer.backgroundColor = color.CGColor;
            subview.layer.cornerRadius = 1.5f;
            NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed applied backgroundColor on %@", className);
          }
        }
      }
      [sv flashScrollIndicators];
      NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor:delayed called flashScrollIndicators");
    });
  } else {
    NSLog(@"[TiUIScrollViewProxy] setScrollIndicatorColor: view not attached or value is nil/NSNull");
  }
}

- (void)windowWillOpen
{
  [super windowWillOpen];

  // Since layout children is overridden in scrollview need to make sure that
  // a full layout occurs at least once if view is attached
  if ([self viewAttached]) {
    [self contentsWillChange];

    // CRITICAL: Re-apply contentInsets and scrollIndicatorInsets here
    // because they may have been set during initialization when the view
    // was not yet attached. Safe area insets are now calculated.
    id savedContentInsets = [self valueForUndefinedKey:@"contentInsets"];
    if (savedContentInsets != nil && ![savedContentInsets isEqual:[NSNull null]]) {
      UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;

      // Extract only the inset values (ignore animation options)
      NSNumber *top = savedContentInsets[@"top"];
      NSNumber *left = savedContentInsets[@"left"];
      NSNumber *bottom = savedContentInsets[@"bottom"];
      NSNumber *right = savedContentInsets[@"right"];

      UIEdgeInsets insets = UIEdgeInsetsMake(
          top ? top.floatValue : 0.0,
          left ? left.floatValue : 0.0,
          bottom ? bottom.floatValue : 0.0,
          right ? right.floatValue : 0.0);
      scrollView.contentInset = insets;
    }

    id savedVerticalScrollIndicatorInsets = [self valueForUndefinedKey:@"verticalScrollIndicatorInsets"];
    if (savedVerticalScrollIndicatorInsets != nil && ![savedVerticalScrollIndicatorInsets isEqual:[NSNull null]]) {
      UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
      scrollView.automaticallyAdjustsScrollIndicatorInsets = NO;

      // Extract all inset values (ignore animation options)
      NSNumber *top = savedVerticalScrollIndicatorInsets[@"top"];
      NSNumber *left = savedVerticalScrollIndicatorInsets[@"left"];
      NSNumber *bottom = savedVerticalScrollIndicatorInsets[@"bottom"];
      NSNumber *right = savedVerticalScrollIndicatorInsets[@"right"];

      UIEdgeInsets insets = UIEdgeInsetsMake(
          top ? top.floatValue : 0.0,
          left ? left.floatValue : 0.0,
          bottom ? bottom.floatValue : 0.0,
          right ? right.floatValue : 0.0);
      scrollView.scrollIndicatorInsets = insets;
    }

    id savedHorizontalScrollIndicatorInsets = [self valueForUndefinedKey:@"horizontalScrollIndicatorInsets"];
    if (savedHorizontalScrollIndicatorInsets != nil && ![savedHorizontalScrollIndicatorInsets isEqual:[NSNull null]]) {
      UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
      scrollView.automaticallyAdjustsScrollIndicatorInsets = NO;

      // Extract all inset values (ignore animation options)
      NSNumber *top = savedHorizontalScrollIndicatorInsets[@"top"];
      NSNumber *left = savedHorizontalScrollIndicatorInsets[@"left"];
      NSNumber *bottom = savedHorizontalScrollIndicatorInsets[@"bottom"];
      NSNumber *right = savedHorizontalScrollIndicatorInsets[@"right"];

      UIEdgeInsets insets = UIEdgeInsetsMake(
          top ? top.floatValue : 0.0,
          left ? left.floatValue : 0.0,
          bottom ? bottom.floatValue : 0.0,
          right ? right.floatValue : 0.0);
      scrollView.scrollIndicatorInsets = insets;
    }

    // Re-apply scrollIndicatorColor after view is attached
    NSLog(@"[TiUIScrollViewProxy] windowWillOpen: checking scrollIndicatorColor");
    id savedScrollIndicatorColor = [self valueForUndefinedKey:@"scrollIndicatorColor"];
    NSLog(@"[TiUIScrollViewProxy] windowWillOpen: savedScrollIndicatorColor = %@", savedScrollIndicatorColor);
    if (savedScrollIndicatorColor != nil && ![savedScrollIndicatorColor isEqual:[NSNull null]]) {
      NSLog(@"[TiUIScrollViewProxy] windowWillOpen: applying scrollIndicatorColor");
      UIScrollView *scrollView = [(TiUIScrollView *)[self view] scrollView];
      UIColor *color = [[TiUtils colorValue:savedScrollIndicatorColor] color];
      NSLog(@"[TiUIScrollViewProxy] windowWillOpen: parsed color = %@", color);
      if (color != nil) {
        // Force indicator recreation by toggling visibility
        scrollView.showsVerticalScrollIndicator = NO;
        scrollView.showsHorizontalScrollIndicator = NO;
        [scrollView setNeedsLayout];
        [scrollView layoutIfNeeded];

        scrollView.showsVerticalScrollIndicator = YES;
        scrollView.showsHorizontalScrollIndicator = YES;
        [scrollView setNeedsLayout];
        [scrollView layoutIfNeeded];

        // Apply color on next runloop to ensure indicators are fully created
        dispatch_async(dispatch_get_main_queue(), ^{
          UIScrollView *sv = [(TiUIScrollView *)[self view] scrollView];
          for (UIView *subview in sv.subviews) {
            NSString *className = NSStringFromClass([subview class]);
            NSLog(@"[TiUIScrollViewProxy] windowWillOpen:delayed subview: %@", className);
            if ([className isEqualToString:@"_UIScrollViewScrollIndicator"] || [subview isKindOfClass:[UIImageView class]]) {
              NSLog(@"[TiUIScrollViewProxy] windowWillOpen:delayed found indicator: %@", className);
              if ([subview isKindOfClass:[UIImageView class]]) {
                UIImageView *imageView = (UIImageView *)subview;
                if (imageView.image != nil) {
                  imageView.tintColor = color;
                  imageView.image = [imageView.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
                  NSLog(@"[TiUIScrollViewProxy] windowWillOpen:delayed applied tint via UIImageView");
                }
              } else {
                subview.backgroundColor = color;
                subview.layer.backgroundColor = color.CGColor;
                subview.layer.cornerRadius = 1.5f;
                NSLog(@"[TiUIScrollViewProxy] windowWillOpen:delayed applied backgroundColor on %@", className);
              }
            }
          }
          [sv flashScrollIndicators];
          NSLog(@"[TiUIScrollViewProxy] windowWillOpen:delayed called flashScrollIndicators");
        });
      }
    } else {
      NSLog(@"[TiUIScrollViewProxy] windowWillOpen: skipping scrollIndicatorColor (nil or NSNull)");
    }
  }
}

- (void)contentsWillChange
{
  if ([self viewAttached]) {
    [(TiUIScrollView *)[self view] setNeedsHandleContentSize];
  }
  [super contentsWillChange];
}

- (void)willChangeSize
{
  if ([self viewAttached]) {
    [(TiUIScrollView *)[self view] setNeedsHandleContentSizeIfAutosizing];
  }
  [super willChangeSize];
}

- (void)layoutChildren:(BOOL)optimize
{
  if (![self viewAttached]) {
    return;
  }

  [(TiUIScrollView *)[self view] handleContentSizeIfNeeded];
}

- (void)layoutChildrenAfterContentSize:(BOOL)optimize
{
  [super layoutChildren:optimize];
}

- (CGFloat)autoWidthForSize:(CGSize)size
{
#ifndef TI_USE_AUTOLAYOUT
  BOOL flexibleContentWidth = YES;
  BOOL flexibleContentHeight = YES;
  CGSize contentSize = CGSizeMake(size.width, size.height);
  id cw = [self valueForUndefinedKey:@"contentWidth"];
  id ch = [self valueForUndefinedKey:@"contentHeight"];
  TiDimension contentWidth = TiDimensionUndefined;
  TiDimension contentHeight = TiDimensionUndefined;
  if (cw) {
    contentWidth = TiDimensionFromObject(cw);
  }
  if (ch) {
    contentHeight = TiDimensionFromObject(ch);
  }

  if (TiDimensionIsAutoFill(contentWidth)) {
    return size.width;
  }

  if (TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
    return TiDimensionCalculateValue(contentWidth, size.width);
  }

  if (TiDimensionIsAutoFill(contentHeight) || TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
    contentSize.height = MAX(TiDimensionCalculateValue(contentHeight, size.height), size.height);
  }

  CGFloat result = 0.0;

  if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
    // Vertical layout. Just get the maximum child width
    CGFloat thisWidth = 0.0;
    NSArray *subproxies = [self children];
    for (TiViewProxy *thisChildProxy in subproxies) {
      thisWidth = [thisChildProxy minimumParentWidthForSize:contentSize];
      if (result < thisWidth) {
        result = thisWidth;
      }
    }
  } else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
    // Horizontal Layout with auto width. Stretch Indefinitely.
    NSArray *subproxies = [self children];
    for (TiViewProxy *thisChildProxy in subproxies) {
      if ([thisChildProxy widthIsAutoFill]) {
        // result += size.width;
        result += [thisChildProxy minimumParentWidthForSize:size];
      } else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.width)) {
        result += [thisChildProxy minimumParentWidthForSize:size];
      } else {
        result += [thisChildProxy minimumParentWidthForSize:contentSize];
      }
    }
  } else {
    result = [super autoWidthForSize:contentSize];
  }
  return result;
#else
  return 0.0;
#endif
}

- (CGFloat)autoHeightForSize:(CGSize)size
{
#ifndef TI_USE_AUTOLAYOUT
  BOOL flexibleContentWidth = YES;
  BOOL flexibleContentHeight = YES;
  CGSize contentSize = CGSizeMake(size.width, size.height);
  id cw = [self valueForUndefinedKey:@"contentWidth"];
  id ch = [self valueForUndefinedKey:@"contentHeight"];
  TiDimension contentWidth = TiDimensionUndefined;
  TiDimension contentHeight = TiDimensionUndefined;
  if (cw) {
    contentWidth = TiDimensionFromObject(cw);
  }
  if (ch) {
    contentHeight = TiDimensionFromObject(ch);
  }

  if (TiDimensionIsAutoFill(contentHeight)) {
    return size.height;
  }
  if (TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
    return TiDimensionCalculateValue(contentHeight, size.height);
  }

  if (TiDimensionIsAutoFill(contentWidth) || TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
    contentSize.width = MAX(TiDimensionCalculateValue(contentWidth, size.width), size.width);
    flexibleContentWidth = NO;
  } else {
    contentSize.width = [self autoWidthForSize:size];
  }

  CGFloat result = 0.0;
  if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
    NSArray *subproxies = [self children];
    for (TiViewProxy *thisChildProxy in subproxies) {
      if ([thisChildProxy heightIsAutoFill]) {
        // result += size.height;
        result += [thisChildProxy minimumParentHeightForSize:size];
      } else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.height)) {
        result += [thisChildProxy minimumParentHeightForSize:size];
      } else {
        result += [thisChildProxy minimumParentHeightForSize:contentSize];
      }
    }
  } else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
    if (flexibleContentWidth) {
      CGFloat thisHeight = 0;
      NSArray *subproxies = [self children];
      for (TiViewProxy *thisChildProxy in subproxies) {
        if ([thisChildProxy heightIsAutoFill]) {
          // thisHeight = size.height;
          thisHeight = [thisChildProxy minimumParentHeightForSize:contentSize];
        } else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.height)) {
          thisHeight = [thisChildProxy minimumParentHeightForSize:size];
        } else {
          thisHeight = [thisChildProxy minimumParentHeightForSize:contentSize];
        }
        if (result < thisHeight) {
          result = thisHeight;
        }
      }
    } else {
      // Not flexible width and wraps
      result = [super autoHeightForSize:contentSize];
    }
  } else {
    result = [super autoHeightForSize:contentSize];
  }
  return result;
#else
  return 0.0;
#endif
}

- (CGRect)computeChildSandbox:(TiViewProxy *)child withBounds:(CGRect)bounds
{
#ifndef TI_USE_AUTOLAYOUT
  CGRect viewBounds = CGRectMake(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
  CGRect contentSize = CGRectMake(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
  if ([self viewAttached]) {
    viewBounds = [[self view] bounds];
  }
  BOOL flexibleContentWidth = YES;
  BOOL flexibleContentHeight = YES;
  id cw = [self valueForUndefinedKey:@"contentWidth"];
  id ch = [self valueForUndefinedKey:@"contentHeight"];
  TiDimension contentWidth = TiDimensionUndefined;
  TiDimension contentHeight = TiDimensionUndefined;
  if (cw) {
    contentWidth = TiDimensionFromObject(cw);
  }
  if (ch) {
    contentHeight = TiDimensionFromObject(ch);
  }

  if (TiDimensionIsAutoFill(contentWidth) || TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
    flexibleContentWidth = NO;
  }
  if (TiDimensionIsAutoFill(contentHeight) || TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
    flexibleContentHeight = NO;
  }

  contentSize.size.width = MAX(contentSize.size.width, viewBounds.size.width);
  contentSize.size.height = MAX(contentSize.size.height, viewBounds.size.height);

  if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
    if (TiDimensionIsPercent(child->layoutProperties.height)) {
      bounds.origin.y = verticalLayoutBoundary;
      bounds.size.height = [child minimumParentHeightForSize:viewBounds.size];
      verticalLayoutBoundary += bounds.size.height;
      return bounds;
    } else if (flexibleContentHeight) {
      // Match autoHeight behavior
      if ([child heightIsAutoFill]) {
        bounds.origin.y = verticalLayoutBoundary;
        bounds.size.height = [child minimumParentHeightForSize:viewBounds.size];
        verticalLayoutBoundary += bounds.size.height;
      } else {
        bounds.origin.y = verticalLayoutBoundary;
        bounds.size.height = [child minimumParentHeightForSize:contentSize.size];
        verticalLayoutBoundary += bounds.size.height;
      }
      return bounds;
    } else {
      return [super computeChildSandbox:child withBounds:contentSize];
    }
  } else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
    if (flexibleContentWidth) {
      // Match autoWidth behavior
      bounds.origin.x = horizontalLayoutBoundary;
      bounds.size.width = [child minimumParentWidthForSize:viewBounds.size];
      horizontalLayoutBoundary += bounds.size.width;
      bounds.size.height = contentSize.size.height;
      return bounds;
    } else {
      return [super computeChildSandbox:child withBounds:contentSize];
    }
  }
#endif
}

- (void)childWillResize:(TiViewProxy *)child
{
  [super childWillResize:child];
  [(TiUIScrollView *)[self view] setNeedsHandleContentSizeIfAutosizing];
}

- (BOOL)optimizeSubviewInsertion
{
  return YES;
}

#ifndef TI_USE_AUTOLAYOUT
- (UIView *)parentViewForChild:(TiViewProxy *)child
{
  return [(TiUIScrollView *)[self view] wrapperView];
}
#endif
- (void)scrollTo:(id)args
{
  TiPoint *offset = [[TiPoint alloc] initWithPoint:CGPointMake([TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]])];

  if ([args count] == 3) {
    id options = [args objectAtIndex:2];
    ENSURE_TYPE(options, NSDictionary);

    [self setContentOffset:offset withObject:options];
  } else {
    [self setContentOffset:offset withObject:Nil];
  }

  [offset release];
}

- (void)scrollToBottom:(id)unused
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUIScrollView *)[self view] scrollToBottom];
      },
      YES);
}

- (void)scrollToTop:(id)unused
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUIScrollView *)[self view] scrollToTop];
      },
      YES);
}

- (void)setContentOffset:(id)args
{
  id arg1 = args;
  id arg2 = nil;
  if ([args isKindOfClass:[NSArray class]]) {
    arg1 = VALUE_AT_INDEX_OR_NIL(args, 0);
    arg2 = VALUE_AT_INDEX_OR_NIL(args, 1);
  }
  [self setContentOffset:arg1 withObject:arg2];
}

- (void)setContentOffset:(id)value withObject:(id)animated
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUIScrollView *)[self view] setContentOffset_:value withObject:animated];
      },
      YES);
}

- (void)setZoomScale:(id)args
{
  id arg1 = args;
  id arg2 = nil;
  if ([args isKindOfClass:[NSArray class]]) {
    arg1 = VALUE_AT_INDEX_OR_NIL(args, 0);
    arg2 = VALUE_AT_INDEX_OR_NIL(args, 1);
  }
  [self setZoomScale:arg1 withObject:arg2];
}

- (void)setZoomScale:(id)value withObject:(id)animated
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUIScrollView *)[self view] setZoomScale_:value withObject:animated];
      },
      YES);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView_ // scrolling has ended
{
  if ([self _hasListeners:@"scrollEnd"]) { // TODO: Deprecate old event.
    [self fireEvent:@"scrollEnd" withObject:nil];
  }
  if ([self _hasListeners:@"scrollend"]) {
    [self fireEvent:@"scrollend" withObject:nil];
  }
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  CGPoint offset = [scrollView contentOffset];
  if ([self _hasListeners:@"scroll"]) {
    [self fireEvent:@"scroll"
         withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                      NUMFLOAT(offset.x), @"x",
                                  NUMFLOAT(offset.y), @"y",
                                  NUMFLOAT(scrollView.zoomScale), @"curZoomScale",
                                  NUMBOOL([scrollView isZooming]), @"zooming",
                                  NUMBOOL([scrollView isDecelerating]), @"decelerating",
                                  NUMBOOL([scrollView isDragging]), @"dragging",
                                  [TiUtils sizeToDictionary:scrollView.contentSize], @"contentSize",
                                  nil]];
  }
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(CGFloat)scale
{
  [self replaceValue:NUMFLOAT(scale) forKey:@"zoomScale" notification:NO];

  if ([self _hasListeners:@"scale"]) {
    [self fireEvent:@"scale"
         withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                      NUMFLOAT(scale), @"scale",
                                  nil]];
  }
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  CGPoint offset = [scrollView contentOffset];
  NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:
                                         NUMFLOAT(offset.x), @"x",
                                     NUMFLOAT(offset.y), @"y",
                                     NUMBOOL([scrollView isDecelerating]), @"decelerating",
                                     [TiUtils sizeToDictionary:scrollView.contentSize], @"contentSize",
                                     nil];
  if ([self _hasListeners:@"dragStart"]) { // TODO: Deprecate old event
    [self fireEvent:@"dragStart" withObject:dict];
  }
  if ([self _hasListeners:@"dragstart"]) {
    [self fireEvent:@"dragstart" withObject:dict];
  }
}

// listener which tells when dragging ended in the scroll view.
- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  CGPoint offset = [scrollView contentOffset];
  NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:
                                         NUMFLOAT(offset.x), @"x",
                                     NUMFLOAT(offset.y), @"y",
                                     [NSNumber numberWithBool:decelerate], @"decelerate", nil,
                                     [TiUtils sizeToDictionary:scrollView.contentSize], @"contentSize",
                                     nil];
  if ([self _hasListeners:@"dragEnd"]) { // TODO: Deprecate old event
    [self fireEvent:@"dragEnd" withObject:dict];
  }
  if ([self _hasListeners:@"dragend"]) {
    [self fireEvent:@"dragend" withObject:dict];
  }
}

#pragma accessibility label

- (void)setAccessibilityLabel:(id)accessibilityLabel
{
  if (self.accessibilityLabel != nil) {
    self.accessibilityLabel = nil;
  }
}

- (void)setAccessibilityValue:(id)accessibilityValue
{
  if (self.accessibilityValue != nil) {
    self.accessibilityValue = nil;
  }
}

- (void)setAccessibilityHint:(id)accessibilityHint
{
  if (self.accessibilityHint != nil) {
    self.accessibilityHint = nil;
  }
}

- (void)setAccessibilityHidden:(id)accessibilityHidden
{
  // Needed to overwrite the method to make sure the variable stays null
}

DEFINE_DEF_PROP(scrollsToTop, [NSNumber numberWithBool:YES]);

@end

#endif
