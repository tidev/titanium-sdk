/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiApp.h>

// Keep the test host independent of app.js; each test supplies its own runtime.
@interface SceneTestApplication : TiApp
@end
@implementation SceneTestApplication
- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)options {
  self.window =
      [[[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds] autorelease];
  self.window.rootViewController =
      [[[UIViewController alloc] init] autorelease];
  [self.window makeKeyAndVisible];
  return YES;
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil,
                             NSStringFromClass(SceneTestApplication.class));
  }
}
