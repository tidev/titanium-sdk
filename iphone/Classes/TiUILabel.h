/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import <TitaniumKit/TiUIView.h>

@interface TiUILabel : TiUIView <LayoutAutosizing> {
  @private
  UILabel *label;
  UIView *wrapperView;
  BOOL requiresLayout;
  CGRect padding;
  UIControlContentVerticalAlignment verticalAlign;
  CGRect initialLabelFrame;
  CGFloat minFontSize;
  NSString *originalText;
}

@property (nonatomic, getter=isHighlighted) BOOL highlighted; // default is NO
- (UILabel *)label;
@end

#endif
