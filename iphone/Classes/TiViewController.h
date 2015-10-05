/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiControllerProtocols.h"

@interface TiViewController : UIViewController {

    TiViewProxy* _proxy;
    TiOrientationFlags _supportedOrientations;
}

-(id)initWithViewProxy:(TiViewProxy*)window;
-(TiViewProxy*) proxy;

@end
