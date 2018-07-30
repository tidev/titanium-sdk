//
//  TiWindowProxy+Addons.m
//  Titanium
//
//  Created by Hans Knöchel on 30.07.18.
//

#import "TiWindowProxy+Addons.h"

@implementation TiWindowProxy (Addons)

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
- (TiUIiOSNavWindowProxy *)navigationWindow
{
  if (parentController != nil && [parentController isKindOfClass:[TiUIiOSNavWindowProxy class]]) {
    return (TiUIiOSNavWindowProxy *)parentController;
  }
  
  NSLog(@"[ERROR] Trying to receive a Ti.UI.NavigationWindow instance that does not exist in this context!");
  return nil;
}
#endif

@end
