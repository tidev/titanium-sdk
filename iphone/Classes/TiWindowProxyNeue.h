//
//  TiWindowProxyNeue.h
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import "TiViewProxy.h"
#import "TiViewControllerNeue.h"

@interface TiWindowProxyNeue : TiViewProxy<TiWindowProtocol> {
@protected
    TiViewControllerNeue* controller;
    id<TiOrientationController> parentController;
    TiOrientationFlags _supportedOrientations;
    BOOL opening;
    BOOL opened;
    BOOL closing;
}

@end
