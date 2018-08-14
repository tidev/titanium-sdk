#import "TiUIApplication.h"

@implementation TiUIApplication

- (void)sendEvent:(UIEvent *)event
{
  [super sendEvent:event];

  for (UITouch *touch in event.allTouches) {
    if (touch.phase == UITouchPhaseBegan) {
      [[NSNotificationCenter defaultCenter] postNotificationName:@"kTiUserInteraction" object:nil];
    }
  }
}

@end
