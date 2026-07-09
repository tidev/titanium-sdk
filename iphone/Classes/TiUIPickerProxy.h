/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import <TitaniumKit/TiViewProxy.h>

@interface TiUIPickerProxy : TiViewProxy {

  @private
  NSArray *selectOnLoad;
}

- (void)setSelectedRow:(id)args;
- (void)reloadColumn:(id)column;

@end

#endif
