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
  return YES;
}
@end

@interface SceneTestWindowDelegate : NSObject <UIWindowSceneDelegate>
@end
@implementation SceneTestWindowDelegate
- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)options {
  TiApp *application = [TiApp applicationInstance];
  application.window = [[[UIWindow alloc]
      initWithWindowScene:(UIWindowScene *)scene] autorelease];
  application.window.rootViewController =
      [[[UIViewController alloc] init] autorelease];
  [application.window makeKeyAndVisible];
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil,
                             NSStringFromClass(SceneTestApplication.class));
  }
}
