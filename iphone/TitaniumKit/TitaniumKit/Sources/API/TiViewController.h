/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiControllerProtocols.h"
#import <UIKit/UIKit.h>

@class TiApp;

@interface TiViewController : UIViewController <UIAdaptivePresentationControllerDelegate> {

  TiViewProxy *_proxy;
  TiOrientationFlags _supportedOrientations;
}

@property (nonatomic, retain) NSArray *previewActions;

- (id)initWithViewProxy:(TiViewProxy *)window;
- (TiViewProxy *)proxy;
- (TiApp *)owningApp API_AVAILABLE(ios(13_0));

@end
