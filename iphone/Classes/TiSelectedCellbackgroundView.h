/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITABLEVIEW) || defined(USE_TI_UILISTVIEW)

#import <UIKit/UIKit.h>

typedef enum {
  TiCellBackgroundViewPositionTop,
  TiCellBackgroundViewPositionMiddle,
  TiCellBackgroundViewPositionBottom,
  TiCellBackgroundViewPositionSingleLine
} TiCellBackgroundViewPosition;

@interface TiSelectedCellBackgroundView : UIView {
  TiCellBackgroundViewPosition position;
  UIColor *fillColor;
  BOOL grouped;
}
@property (nonatomic) TiCellBackgroundViewPosition position;
@property (nonatomic, retain) UIColor *fillColor;
@property (nonatomic) BOOL grouped;

@end

#endif
