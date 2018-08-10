#import "TiUIApplication.h"

@implementation TiUIApplication

- (void)sendEvent:(UIEvent *)event
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"kTiUserInteraction" object:nil];
    [super sendEvent:event];
}

@end
