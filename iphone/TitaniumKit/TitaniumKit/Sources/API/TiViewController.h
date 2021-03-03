/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiControllerProtocols.h"
#import <UIKit/UIKit.h>

@interface TiViewController : UIViewController <UIAdaptivePresentationControllerDelegate> {

  TiViewProxy *_proxy;
  TiOrientationFlags _supportedOrientations;
}

@property (nonatomic, retain) NSArray *previewActions;

- (id)initWithViewProxy:(TiViewProxy *)window;
- (TiViewProxy *)proxy;

@end
