//
//  TiSceneDelegate.m
//  TitaniumKit
//
//  Created by Hans Knöchel on 04.05.24.
//  Copyright © 2024 Hans Knoechel. All rights reserved.
//

#import "TiSceneDelegate.h"

@implementation TiSceneDelegate

- (void)sceneWillResignActive:(UIScene *)scene
{
  [[TiApp app] sceneWillResignActive:scene];
}

- (void)sceneDidBecomeActive:(UIScene *)scene
{
  [[TiApp app] sceneDidBecomeActive:scene];
}

- (void)sceneDidEnterBackground:(UIScene *)scene
{
  [[TiApp app] sceneDidEnterBackground:scene];
}

- (void)sceneWillEnterForeground:(UIScene *)scene
{
  [[TiApp app] sceneWillEnterForeground:scene];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  [[TiApp app] scene:scene openURLContexts:URLContexts];
}

- (UISceneConfiguration *)application:(UIApplication *)application configurationForConnectingSceneSession:(UISceneSession *)connectingSceneSession options:(UISceneConnectionOptions *)options
{
  return [[TiApp app] application:application configurationForConnectingSceneSession:connectingSceneSession options:options];
}

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions
{
  [[TiApp app] scene:scene willConnectToSession:session options:connectionOptions];
}

@end
