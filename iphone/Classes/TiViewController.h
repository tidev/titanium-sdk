//
//  TiViewController.h
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import <UIKit/UIKit.h>
#import "TiControllerProtocols.h"

@interface TiViewController : UIViewController {

    TiViewProxy* _proxy;
    TiOrientationFlags _supportedOrientations;
}

-(id)initWithViewProxy:(TiViewProxy*)window;
-(TiViewProxy*) proxy;

@end
