/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import <TitaniumKit/TiUIView.h>

@class TiUIPickerItemProxy;

@interface TiUIPicker : TiUIView <UIPickerViewDelegate, UIPickerViewDataSource> {
  @private
  UIControl *picker;
  int type;

  BOOL propertiesConfigured; // We're order-dependent on type being configured first, so have to re-configure after the initial setup.  What a pain!
}

@property (nonatomic, readonly, copy) id value_;

- (NSArray *)columns;
- (void)reloadColumn:(id)column;
- (TiProxy *)selectedRowForColumn:(NSInteger)column;
- (void)selectRowForColumn:(NSInteger)column row:(NSInteger)row animated:(BOOL)animated;
- (void)selectRow:(NSArray *)array;

@end
#endif
