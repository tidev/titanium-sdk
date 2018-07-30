//
//  TiWindowProxy+Addons.h
//  Titanium
//
//  Created by Hans Knöchel on 30.07.18.
//

#import <Foundation/Foundation.h>
#import <TitaniumKit/TiWindowProxy.h>

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
#import "TiUIiOSNavWindowProxy.h"
#endif

@interface TiWindowProxy (Addons)

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
- (TiUIiOSNavWindowProxy *)navigationWindow;
#endif

@end
