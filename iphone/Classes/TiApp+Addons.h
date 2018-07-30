//
//  TiApp+Addons.h
//  Titanium
//
//  Created by Hans Knöchel on 30.07.18.
//

#import <TitaniumKit/TiApp.h>

@interface TiApp (Addons)

#ifdef USE_TI_FETCH
- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;
#endif

#ifdef USE_TI_SILENTPUSH
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler;
#endif

#pragma mark Handoff Delegates

#ifdef USE_TI_APPIOS
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *_Nullable))restorationHandler;
#endif

@end
