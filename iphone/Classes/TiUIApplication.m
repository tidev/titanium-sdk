#import "TiUIApplication.h"

@implementation TiUIApplication

- (void)sendEvent:(UIEvent *)event
{
    NSLog(@"UIEvent");
    // Fire event towards Titanium
    [super sendEvent:event];
}

@end
