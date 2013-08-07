//
//  TiWindowProxyNeue.h
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import "TiViewProxy.h"
#import "TiTab.h"
#import "TiViewControllerNeue.h"

@interface TiWindowProxyNeue : TiViewProxy<TiWindowProtocol, TiAnimationDelegate> {
@protected
    TiViewControllerNeue* controller;
    id<TiOrientationController> parentController;
    TiOrientationFlags _supportedOrientations;
    BOOL opening;
    BOOL opened;
    BOOL closing;
    BOOL focussed;
    BOOL isModal;
    TiViewProxy<TiTab> *tab;
    TiAnimation * openAnimation;
    TiAnimation * closeAnimation;
    UIView* animatedOver;
}

@property (nonatomic, readwrite, assign) TiViewProxy<TiTab> *tab;

@end
