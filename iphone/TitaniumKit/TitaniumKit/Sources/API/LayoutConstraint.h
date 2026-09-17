/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDimension.h"
#import "TiUtils.h"
#import <UIKit/UIKit.h>

/**
 A protocol to handle layout auto-sizing based on given sizes and rects.
 */
@protocol LayoutAutosizing

@optional

- (CGFloat)minimumParentWidthForSize:(CGSize)size;
- (CGFloat)minimumParentHeightForSize:(CGSize)size;

- (CGFloat)autoWidthForSize:(CGSize)size;
- (CGFloat)autoHeightForSize:(CGSize)size;

- (CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth;
- (CGFloat)contentHeightForWidth:(CGFloat)width;

- (CGFloat)verifyWidth:(CGFloat)suggestedWidth;
- (CGFloat)verifyHeight:(CGFloat)suggestedHeight;

- (UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing;

- (TiDimension)defaultAutoWidthBehavior:(id)unused;
- (TiDimension)defaultAutoHeightBehavior:(id)unused;

@end
#ifndef TI_USE_AUTOLAYOUT

/**
 Layout options to determine absolute, vertical and horizontal layout.
 */
typedef enum {
  TiLayoutRuleAbsolute,
  TiLayoutRuleVertical,
  TiLayoutRuleHorizontal,
} TiLayoutRule;

TI_INLINE CGFloat TiFixedValueRuleFromObject(id object)
{
  return [TiUtils floatValue:object def:0];
}

TI_INLINE TiLayoutRule TiLayoutRuleFromObject(id object)
{
  if ([object isKindOfClass:[NSString class]]) {
    if ([object caseInsensitiveCompare:@"vertical"] == NSOrderedSame) {
      return TiLayoutRuleVertical;
    }
    if ([object caseInsensitiveCompare:@"horizontal"] == NSOrderedSame) {
      return TiLayoutRuleHorizontal;
    }
  }
  return TiLayoutRuleAbsolute;
}

TI_INLINE BOOL TiLayoutRuleIsAbsolute(TiLayoutRule rule)
{
  return rule == TiLayoutRuleAbsolute;
}

TI_INLINE BOOL TiLayoutRuleIsVertical(TiLayoutRule rule)
{
  return rule == TiLayoutRuleVertical;
}

TI_INLINE BOOL TiLayoutRuleIsHorizontal(TiLayoutRule rule)
{
  return rule == TiLayoutRuleHorizontal;
}

typedef struct LayoutConstraint {

  TiDimension centerX;
  TiDimension left;
  TiDimension right;
  TiDimension width;

  TiDimension centerY;
  TiDimension top;
  TiDimension bottom;
  TiDimension height;

  TiLayoutRule layoutStyle;
  struct {
    unsigned int horizontalWrap : 1;
  } layoutFlags;

  CGFloat minimumHeight;
  CGFloat minimumWidth;

  // A maximum of 0 means "unconstrained". Relying on 0 rather than a negative sentinel keeps
  // the zero-initialized struct unconstrained by default, since nothing initializes it explicitly.
  CGFloat maximumHeight;
  CGFloat maximumWidth;

} LayoutConstraint;

TI_INLINE BOOL TiLayoutFlagsHasHorizontalWrap(LayoutConstraint *constraint)
{
  return constraint->layoutFlags.horizontalWrap;
}

/**
 Clamps a computed width to the constraint's "minWidth"/"maxWidth" bounds.
 When the two conflict the minimum wins, matching CSS and the Android implementation.
 */
TI_INLINE CGFloat TiLayoutClampWidth(LayoutConstraint *constraint, CGFloat width)
{
  if (constraint->maximumWidth > 0) {
    width = MIN(constraint->maximumWidth, width);
  }
  return MAX(constraint->minimumWidth, width);
}

/**
 Clamps a computed height to the constraint's "minHeight"/"maxHeight" bounds.
 When the two conflict the minimum wins, matching CSS and the Android implementation.
 */
TI_INLINE CGFloat TiLayoutClampHeight(LayoutConstraint *constraint, CGFloat height)
{
  if (constraint->maximumHeight > 0) {
    height = MIN(constraint->maximumHeight, height);
  }
  return MAX(constraint->minimumHeight, height);
}

@class TiUIView;
@class TiViewProxy;

void ApplyConstraintToViewWithBounds(LayoutConstraint *constraint, TiUIView *subView, CGRect viewBounds);

CGFloat WidthFromConstraintGivenWidth(LayoutConstraint *constraint, CGFloat viewWidth);

CGSize SizeConstraintViewWithSizeAddingResizing(LayoutConstraint *constraint, NSObject<LayoutAutosizing> *autoSizer, CGSize referenceSize, UIViewAutoresizing *resultResizing);

CGPoint PositionConstraintGivenSizeBoundsAddingResizing(LayoutConstraint *constraint, TiViewProxy *viewProxy, CGSize viewSize, CGPoint anchorPoint, CGSize referenceSize, CGSize sandboxSize, UIViewAutoresizing *resultResizing);

BOOL IsLayoutUndefined(LayoutConstraint *constraint);

#endif
