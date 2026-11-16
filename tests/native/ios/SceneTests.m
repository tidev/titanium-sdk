/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiAppiOSProxy.h"
#import <TitaniumKit/KrollBridge.h>
#import <TitaniumKit/KrollContext.h>
#import <TitaniumKit/KrollObject.h>
#import <TitaniumKit/KrollPromise.h>
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiModule.h>
#import <TitaniumKit/TiSceneProxy.h>
#import <TitaniumKit/TiSceneRegistry.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiWindow.h>
#import <TitaniumKit/TiWindowProxy.h>
#import <XCTest/XCTest.h>

@interface TiApp (SceneTests)
- (void)initController;
- (void)finishBoot;
- (void)handleSceneConnectionOptions:(UISceneConnectionOptions *)options;
- (BOOL)handleShortcutItem:(UIApplicationShortcutItem *)item
    queueToBootIfNotLaunched:(BOOL)queue;
@end

@interface TestBridge : KrollBridge
@end
@implementation TestBridge
- (void)didStartNewContext:(KrollContext *)context {
  // Use the real bindings and timers without loading the SDK's app.js
  // bootstrap.
  [self booted];
}
@end

@interface TestScene : TiApp
- (instancetype)initWithIdentifier:(NSString *)identifier;
- (void)startRuntime;
@end
@implementation TestScene
- (instancetype)initWithIdentifier:(NSString *)identifier {
  self = [super init];
  if (self) {
    _sceneId = [identifier copy];
    launchOptions = [[NSMutableDictionary alloc] init];
    [[TiSceneRegistry sharedRegistry] registerTiApp:self
                                       forSceneUUID:identifier];
    [[TiSceneRegistry sharedRegistry] ensureSceneProxyForUUID:identifier
                                                        tiApp:self];
  }
  return self;
}
- (void)startRuntime {
  kjsBridge = [[TestBridge alloc] initWithHost:self];
  [kjsBridge boot:self url:nil preload:nil];
}
- (void)appBoot {
  [self startRuntime];
}
@end

@interface OrientationScene : NSObject
@property(nonatomic) UIInterfaceOrientation interfaceOrientation;
@end
@implementation OrientationScene
- (id)effectiveGeometry {
  return self;
}
@end

@interface OrientationWindow : UIWindow
@property(nonatomic, retain) UIWindowScene *reportedScene;
@end
@implementation OrientationWindow
- (UIWindowScene *)windowScene {
  return self.reportedScene;
}
- (void)dealloc {
  [_reportedScene release];
  [super dealloc];
}
@end

@interface LifecycleModule : TiModule
@property(nonatomic) NSUInteger pauseCount;
@property(nonatomic) NSUInteger shutdownCount;
@end
@implementation LifecycleModule
- (void)suspend:(id)sender {
  self.pauseCount++;
}
- (void)shutdown:(id)sender {
  self.shutdownCount++;
}
@end

@interface SceneEventSpy : TiSceneProxy
@property(nonatomic, retain) NSMutableArray *events;
@end
@implementation SceneEventSpy
- (instancetype)initWithSceneUUID:(NSString *)uuid tiApp:(TiApp *)app {
  self = [super initWithSceneUUID:uuid tiApp:app];
  if (self) {
    self.events = [NSMutableArray array];
  }
  return self;
}
- (void)fireEvent:(NSString *)type withObject:(id)object {
  [self.events addObject:type];
}
- (void)dealloc {
  [_events release];
  [super dealloc];
}
@end

@interface RootWindowController : TiRootViewController
- (void)addRoot:(TiWindowProxy *)proxy;
@end
@implementation RootWindowController
- (void)addRoot:(TiWindowProxy *)proxy {
  [containedWindows addObject:proxy];
}
@end

// Test doubles only provide the read-only UIKit launch payloads.
@interface ConnectionOptions : NSObject
@property(nonatomic, retain) NSSet *userActivities;
@property(nonatomic, retain) NSSet *URLContexts;
@property(nonatomic, retain) UIApplicationShortcutItem *shortcutItem;
@property(nonatomic, retain) id notificationResponse;
@end
@implementation ConnectionOptions
- (void)dealloc {
  [_userActivities release];
  [_URLContexts release];
  [_shortcutItem release];
  [_notificationResponse release];
  [super dealloc];
}
@end

@interface NotificationPayload : NSObject
@property(nonatomic, retain) UNNotificationRequest *request;
@end
@implementation NotificationPayload
- (NSDate *)date {
  return [NSDate date];
}
- (void)dealloc {
  [_request release];
  [super dealloc];
}
@end

@interface NotificationResponse : NSObject
@property(nonatomic, retain) NotificationPayload *notification;
@end
@implementation NotificationResponse
- (NSString *)actionIdentifier {
  return UNNotificationDefaultActionIdentifier;
}
- (void)dealloc {
  [_notification release];
  [super dealloc];
}
@end

@interface SceneSession : NSObject
@end
@implementation SceneSession
- (NSString *)role {
  return UIWindowSceneSessionRoleApplication;
}
@end

@interface SceneTests : XCTestCase
@property(nonatomic, retain) TestScene *first;
@property(nonatomic, retain) TestScene *second;
@end
@implementation SceneTests
- (void)setUp {
  [super setUp];
  self.first = [[[TestScene alloc] initWithIdentifier:@"scene-a"] autorelease];
  self.second = [[[TestScene alloc] initWithIdentifier:@"scene-b"] autorelease];
}
- (void)tearDown {
  [self.first sceneDidDisconnect:nil];
  [self.second sceneDidDisconnect:nil];
  self.first = nil;
  self.second = nil;
  XCTestExpectation *drained =
      [self expectationWithDescription:@"runtime teardown"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [drained fulfill];
  });
  [self waitForExpectations:@[ drained ] timeout:2];
  [super tearDown];
}
- (JSContext *)contextForScene:(TestScene *)scene {
  [scene startRuntime];
  XCTestExpectation *booted =
      [self expectationWithDescription:@"runtime booted"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [booted fulfill];
  });
  [self waitForExpectations:@[ booted ] timeout:2];
  return [JSContext
      contextWithJSGlobalContextRef:scene.krollBridge.krollContext.context];
}
- (void)testPrimarySceneRemainsStableAndPromotesSurvivor {
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  [self.first initController];
  [self.second initController];
  XCTAssertEqual([TiApp app], self.first);
  XCTAssertEqual(registry.primaryScene, self.first);
  [self.first sceneDidDisconnect:nil];
  XCTAssertEqual(registry.primaryScene, self.second);
  XCTAssertEqual([TiApp app], self.second);
}
- (void)testSceneWindowAndStableProxyIdentity {
  RootWindowController *root =
      [[[RootWindowController alloc] init] autorelease];
  TiWindowProxy *window = [[[TiWindowProxy alloc] init] autorelease];
  [root addRoot:window];
  self.first.controller = root;
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  TiSceneProxy *proxy = [[registry sceneProxyForUUID:@"scene-a"] retain];
  XCTAssertEqualObjects(proxy.apiName, @"Ti.App.iOS.SceneProxy");
  XCTAssertEqual([proxy valueForKey:@"window"], window);
  XCTAssertEqual(proxy, [registry ensureSceneProxyForUUID:@"scene-a"
                                                    tiApp:self.first]);
  [self.first sceneDidDisconnect:nil];
  XCTAssertNil(proxy.tiApp);
  XCTAssertEqualObjects([proxy valueForKey:@"window"], NSNull.null);
  [proxy release];
}
- (void)testWindowOrientationUsesItsOwningScene {
  NSArray *orientations = @[
    @(UIInterfaceOrientationPortrait), @(UIInterfaceOrientationLandscapeLeft)
  ];
  NSArray *apps = @[ self.first, self.second ];
  for (NSUInteger i = 0; i < apps.count; i++) {
    TestScene *app = apps[i];
    [self contextForScene:app];
    OrientationScene *scene = [[[OrientationScene alloc] init] autorelease];
    scene.interfaceOrientation = [orientations[i] integerValue];
    OrientationWindow *window =
        [[[OrientationWindow alloc] initWithFrame:CGRectZero] autorelease];
    window.reportedScene = (id)scene;
    app.window = window;
    TiWindowProxy *proxy = [[[TiWindowProxy alloc]
        _initWithPageContext:app.krollBridge] autorelease];
    XCTAssertEqualObjects([proxy valueForKey:@"orientation"], orientations[i]);
    // The stand-in supplies geometry only; UIKit teardown needs a real scene or
    // nil.
    window.reportedScene = nil;
    app.window = nil;
  }
  XCTAssertEqual([TiUtils interfaceOrientationForScene:nil],
                 UIInterfaceOrientationUnknown);
}
- (void)testRestartPreservesSceneIdentityAndStopsOnlyItsOldRuntime {
  UIWindowScene *scene = nil;
  for (UIScene *connectedScene in UIApplication.sharedApplication
           .connectedScenes) {
    if ([connectedScene isKindOfClass:UIWindowScene.class]) {
      scene = (UIWindowScene *)connectedScene;
      break;
    }
  }
  XCTAssertNotNil(scene, @"Connected scenes: %@",
                  UIApplication.sharedApplication.connectedScenes);
  if (scene == nil) {
    return;
  }
  [self contextForScene:self.first];
  [self contextForScene:self.second];
  self.second.window =
      [[[TiWindow alloc] initWithWindowScene:scene] autorelease];
  [self.second initController];
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  TiSceneProxy *proxy = [registry sceneProxyForUUID:self.second.sceneId];
  KrollContext *oldContext = [self.second.krollBridge.krollContext retain];
  KrollBridge *firstBridge = self.first.krollBridge;
  NSMutableDictionary *options = (id)self.second.launchOptions;
  options[@"url"] = @"test://restart";
  [self.second rebootApp];
  XCTAssertFalse(oldContext.running);
  XCTAssertEqual(self.first.krollBridge, firstBridge);
  XCTAssertTrue(firstBridge.krollContext.running);
  XCTAssertEqual(self.second.window.windowScene, scene);
  XCTAssertTrue([self.second.window isKindOfClass:TiWindow.class]);
  XCTAssertEqual([registry sceneProxyForUUID:self.second.sceneId], proxy);
  XCTAssertEqual(registry.sceneCount, 2u);
  XCTAssertEqualObjects(self.second.launchOptions[@"url"], @"test://restart");
  XCTestExpectation *restarted =
      [self expectationWithDescription:@"scene runtime restarted"];
  dispatch_async(dispatch_get_main_queue(), ^{
    XCTAssertEqual(oldContext.context, NULL);
    XCTAssertTrue(self.second.krollBridge.krollContext.running);
    XCTAssertTrue(self.second.appBooted);
    [restarted fulfill];
  });
  [self waitForExpectations:@[ restarted ] timeout:2];
  [oldContext release];
}
- (void)testRequestsSettleByIdentifierAndBindTheProxy {
  JSContext *context = [self contextForScene:self.first];
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  KrollPromise *first =
      [[[KrollPromise alloc] initInContext:context] autorelease];
  KrollPromise *second =
      [[[KrollPromise alloc] initInContext:context] autorelease];
  context[@"first"] = first.JSValue;
  context[@"second"] = second.JSValue;
  [context evaluateScript:
               @"var result, error; first.then(e => result = [e.scene.sceneId, "
               @"e.scene.apiName, typeof e.scene.addEventListener]); "
               @"second.catch(e => error = e.message);"];
  NSString *firstId = [registry registerSceneRequest:first owner:self.first];
  NSString *secondId = [registry registerSceneRequest:second owner:self.first];
  [registry rejectSceneRequest:secondId message:@"second request failed"];
  XCTAssertEqual(registry.pendingSceneRequestCount, 1u);
  [registry completeSceneRequest:@"unrelated-restored-scene"
                           scene:[registry sceneProxyForUUID:@"scene-b"]];
  XCTAssertEqual(registry.pendingSceneRequestCount, 1u);
  [registry completeSceneRequest:firstId
                           scene:[registry sceneProxyForUUID:@"scene-b"]];
  XCTAssertEqualObjects(
      [context[@"result"] toArray],
      (@[ @"scene-b", @"Ti.App.iOS.SceneProxy", @"function" ]));
  XCTAssertEqualObjects([context[@"error"] toString], @"second request failed");
  XCTAssertEqual(registry.pendingSceneRequestCount, 0u);
}
- (void)testDisconnectOnlyCancelsRequestsFromThatScene {
  JSContext *context = [self contextForScene:self.first];
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  KrollPromise *promise =
      [[[KrollPromise alloc] initInContext:context] autorelease];
  context[@"request"] = promise.JSValue;
  [context evaluateScript:@"var error; request.catch(e => error = e.message);"];
  [registry registerSceneRequest:promise owner:self.first];
  [self.second sceneDidDisconnect:nil];
  XCTAssertEqual(registry.pendingSceneRequestCount, 1u);
  [registry cancelSceneRequestsForOwner:self.first];
  XCTAssertEqual(registry.pendingSceneRequestCount, 0u);
  XCTAssertEqualObjects([context[@"error"] toString],
                        @"The requesting scene disconnected");
}
- (void)testLifecycleNotificationsStayWithTheirRuntime {
  [self contextForScene:self.first];
  [self contextForScene:self.second];
  LifecycleModule *first = (id)[self.first moduleNamed:@"LifecycleModule"
                                               context:self.first.krollBridge];
  LifecycleModule *second =
      (id)[self.second moduleNamed:@"LifecycleModule"
                           context:self.second.krollBridge];
  XCTestExpectation *registered =
      [self expectationWithDescription:@"observers registered"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [registered fulfill];
  });
  [self waitForExpectations:@[ registered ] timeout:2];
  [NSNotificationCenter.defaultCenter
      postNotificationName:kTiSuspendNotification
                    object:self.second];
  XCTAssertEqual(first.pauseCount, 0u);
  XCTAssertEqual(second.pauseCount, 1u);
  [NSNotificationCenter.defaultCenter
      postNotificationName:kTiShutdownNotification
                    object:self.second];
  XCTAssertEqual(first.shutdownCount, 0u);
  XCTAssertEqual(second.shutdownCount, 1u);
}
- (void)testSceneEventsAreDeliveredOncePerTransition {
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  SceneEventSpy *proxy =
      [[[SceneEventSpy alloc] initWithSceneUUID:@"scene-a"
                                          tiApp:self.first] autorelease];
  [registry registerSceneProxy:proxy forUUID:@"scene-a"];
  [registry setSceneActive:YES forUUID:@"scene-a"];
  [registry setSceneActive:YES forUUID:@"scene-a"];
  [registry setSceneActive:YES forUUID:@"scene-b"];
  [registry setSceneActive:NO forUUID:@"scene-a"];
  XCTAssertTrue(registry.hasActiveScenes);
  [registry setSceneForeground:YES forUUID:@"scene-a"];
  [registry setSceneForeground:NO forUUID:@"scene-a"];
  XCTAssertEqualObjects(proxy.events,
                        (@[ @"focus", @"blur", @"resumed", @"paused" ]));
}
- (void)testApplicationBackgroundTransferCanCompleteFromAScene {
  TiApp *application = [TiApp applicationInstance];
  [application finishBoot];
  __block NSUInteger completionCount = 0;
  __block NSString *handlerId = nil;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:kTiBackgroundTransfer
                  object:application
                   queue:nil
              usingBlock:^(NSNotification *note) {
                handlerId = [note.userInfo[@"handlerId"] copy];
              }];
  [application application:UIApplication.sharedApplication
      handleEventsForBackgroundURLSession:@"test-session"
                        completionHandler:^{
                          completionCount++;
                        }];
  XCTAssertNotNil(handlerId);
  [self.second performCompletionHandlerForBackgroundTransferWithKey:handlerId];
  XCTAssertEqual(completionCount, 1u);
  XCTAssertEqual(application.backgroundTransferCompletionHandlers.count, 0u);
  [handlerId release];
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}
- (void)testBackgroundFetchKeepsItsApplicationCompletionHandler {
  TiApp *application = [TiApp applicationInstance];
  [application finishBoot];
  __block NSUInteger completions = 0;
  __block NSUInteger events = 0;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:kTiBackgroundFetchNotification
                  object:application
                   queue:nil
              usingBlock:^(NSNotification *note) {
                events++;
                [self.second
                    performCompletionHandlerWithKey:note.userInfo[@"handlerId"]
                                          andResult:
                                              UIBackgroundFetchResultNewData];
              }];
  [application application:UIApplication.sharedApplication
      performFetchWithCompletionHandler:^(UIBackgroundFetchResult result) {
        XCTAssertEqual(result, UIBackgroundFetchResultNewData);
        completions++;
      }];
  XCTAssertEqual(events, 1u);
  XCTAssertEqual(completions, 1u);
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}

- (void)testSilentPushKeepsItsApplicationCompletionHandler {
  TiApp *application = [TiApp applicationInstance];
  [application finishBoot];
  __block NSUInteger completions = 0;
  __block NSUInteger events = 0;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:kTiSilentPushNotification
                  object:application
                   queue:nil
              usingBlock:^(NSNotification *note) {
                events++;
                XCTAssertEqualObjects(note.userInfo[@"payload"], @"push-data");
                [self.first
                    performCompletionHandlerWithKey:note.userInfo[@"handlerId"]
                                          andResult:
                                              UIBackgroundFetchResultNoData];
              }];
  [application application:UIApplication.sharedApplication
      didReceiveRemoteNotification:@{@"payload" : @"push-data"}
            fetchCompletionHandler:^(UIBackgroundFetchResult result) {
              XCTAssertEqual(result, UIBackgroundFetchResultNoData);
              completions++;
            }];
  XCTAssertEqual(events, 1u);
  XCTAssertEqual(completions, 1u);
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}

- (void)testQueuedNotificationsKeepTheirCompletionHandlers {
  __block NSUInteger events = 0;
  __block NSUInteger completions = 0;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:@"test-notification"
                  object:self.first
                   queue:nil
              usingBlock:^(NSNotification *note) {
                events++;
              }];
  for (NSUInteger i = 0; i < 2; i++) {
    [self.first tryToPostNotification:@{}
                 withNotificationName:@"test-notification"
                    completionHandler:^{
                      completions++;
                    }];
  }
  XCTAssertEqual(completions, 0u);
  [self.first finishBoot];
  XCTAssertEqual(events, 2u);
  XCTAssertEqual(completions, 2u);
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}
- (void)testColdAndWarmQuickActionsReachTheirScene {
  __block NSUInteger events = 0;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:kTiApplicationShortcut
                  object:self.first
                   queue:nil
              usingBlock:^(NSNotification *note) {
                events++;
              }];
  UIApplicationShortcutItem *item =
      [[[UIApplicationShortcutItem alloc] initWithType:@"compose"
                                        localizedTitle:@"Compose"] autorelease];
  XCTAssertTrue([self.first handleShortcutItem:item
                      queueToBootIfNotLaunched:YES]);
  XCTAssertEqualObjects(
      self.first
          .launchOptions[UIApplicationLaunchOptionsShortcutItemKey][@"type"],
      @"compose");
  XCTAssertNil(
      self.second.launchOptions[UIApplicationLaunchOptionsShortcutItemKey]);
  [self.first finishBoot];
  XCTAssertEqual(events, 1u);
  __block BOOL handled = NO;
  [self.first windowScene:nil
      performActionForShortcutItem:item
                 completionHandler:^(BOOL success) {
                   handled = success;
                 }];
  XCTAssertTrue(handled);
  XCTAssertEqual(events, 2u);
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}
- (void)testColdLaunchConnectionOptionsPreserveQuickActionsAndNotifications {
  ConnectionOptions *options = [[[ConnectionOptions alloc] init] autorelease];
  options.shortcutItem =
      [[[UIApplicationShortcutItem alloc] initWithType:@"compose"
                                        localizedTitle:@"Compose"] autorelease];
  UNMutableNotificationContent *content =
      [[[UNMutableNotificationContent alloc] init] autorelease];
  content.body = @"Launch notification";
  NotificationPayload *notification =
      [[[NotificationPayload alloc] init] autorelease];
  notification.request = [UNNotificationRequest requestWithIdentifier:@"launch"
                                                              content:content
                                                              trigger:nil];
  NotificationResponse *response =
      [[[NotificationResponse alloc] init] autorelease];
  response.notification = notification;
  options.notificationResponse = response;
  __block NSUInteger events = 0;
  id observer = [NSNotificationCenter.defaultCenter
      addObserverForName:kTiLocalNotificationAction
                  object:self.first
                   queue:nil
              usingBlock:^(NSNotification *note) {
                XCTAssertEqualObjects(note.userInfo[@"alertBody"],
                                      @"Launch notification");
                events++;
              }];
  [self.first handleSceneConnectionOptions:(id)options];
  XCTAssertEqualObjects(
      self.first
          .launchOptions[UIApplicationLaunchOptionsShortcutItemKey][@"type"],
      @"compose");
  XCTAssertEqual(events, 0u);
  [self.first finishBoot];
  XCTAssertEqual(events, 1u);
  [NSNotificationCenter.defaultCenter removeObserver:observer];
}

- (void)testSceneConfigurationComesFromTheActivationRequest {
  NSUserActivity *activity = [[[NSUserActivity alloc]
      initWithActivityType:kTiSceneRequestActivityType] autorelease];
  activity.userInfo =
      @{@"requestId" : @"request-a", @"configurationName" : @"Secondary"};
  ConnectionOptions *options = [[[ConnectionOptions alloc] init] autorelease];
  options.userActivities = [NSSet setWithObject:activity];
  SceneSession *session = [[[SceneSession alloc] init] autorelease];
  UISceneConfiguration *configuration =
      [[TiApp applicationInstance] application:UIApplication.sharedApplication
          configurationForConnectingSceneSession:(id)session
                                         options:(id)options];
  XCTAssertEqualObjects(configuration.name, @"Secondary");
  [self.first handleSceneConnectionOptions:(id)options];
  XCTAssertNil(
      self.first
          .launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey]);
}

- (void)testGlobalSceneEventsReachBothJavaScriptContexts {
  JSContext *first = [self contextForScene:self.first];
  JSContext *second = [self contextForScene:self.second];
  for (TestScene *app in @[ self.first, self.second ]) {
    KrollContext *kroll = app.krollBridge.krollContext;
    JSContext *context =
        [JSContext contextWithJSGlobalContextRef:kroll.context];
    TiAppiOSProxy *proxy = [[[TiAppiOSProxy alloc]
        _initWithPageContext:app.krollBridge] autorelease];
    context[@"ios"] = [JSValue valueWithJSValueRef:[KrollObject toValue:kroll
                                                                  value:proxy]
                                         inContext:context];
    [context
        evaluateScript:
            @"var connections = 0, dismissals = 0; "
            @"ios.addEventListener('scenewillconnect', () => connections++); "
            @"ios.addEventListener('scenediddismiss', () => dismissals++);"];
    XCTAssertNil(context.exception);
  }
  [NSNotificationCenter.defaultCenter
      postNotificationName:kTiSceneWillConnectNotification
                    object:self.second
                  userInfo:@{@"scene" : @"scene-b"}];
  [NSNotificationCenter.defaultCenter
      postNotificationName:kTiSceneDismissNotification
                    object:self.second
                  userInfo:@{@"scene" : @"scene-b"}];
  XCTAssertEqual([first[@"connections"] toInt32], 1);
  XCTAssertEqual([second[@"connections"] toInt32], 1);
  XCTAssertEqual([first[@"dismissals"] toInt32], 1);
  XCTAssertEqual([second[@"dismissals"] toInt32], 1);
  XCTAssertEqualObjects(
      [[first evaluateScript:@"ios.currentScene.sceneId"] toString],
      @"scene-a");
  XCTAssertEqualObjects(
      [[second evaluateScript:@"ios.currentScene.sceneId"] toString],
      @"scene-b");
}

- (void)testRequestSceneRejectsWhenMultipleScenesAreUnavailable {
  JSContext *context = [self contextForScene:self.first];
  KrollContext *kroll = self.first.krollBridge.krollContext;
  TiAppiOSProxy *proxy = [[[TiAppiOSProxy alloc]
      _initWithPageContext:self.first.krollBridge] autorelease];
  context[@"ios"] = [JSValue valueWithJSValueRef:[KrollObject toValue:kroll
                                                                value:proxy]
                                       inContext:context];
  [context evaluateScript:
               @"var error; ios.requestScene().catch(e => error = e.message);"];
  XCTAssertNil(context.exception, @"%@", context.exception);
  XCTestExpectation *rejected =
      [self expectationWithDescription:@"scene request rejected"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [rejected fulfill];
  });
  [self waitForExpectations:@[ rejected ] timeout:2];
  XCTAssertNil(context.exception, @"%@", context.exception);
  XCTAssertEqualObjects([context[@"error"] toString],
                        @"This application does not support multiple scenes");
}

- (void)testDisconnectBeforeRuntimeStartup {
  [self.first startRuntime];
  KrollContext *context = [self.first.krollBridge.krollContext retain];
  [self.first sceneDidDisconnect:nil];
  XCTestExpectation *stopped =
      [self expectationWithDescription:@"unstarted context stopped"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [stopped fulfill];
  });
  [self waitForExpectations:@[ stopped ] timeout:2];
  XCTAssertFalse(self.first.appBooted);
  XCTAssertEqual(context.context, NULL);
  XCTAssertNil(context.delegate);
  [context release];
}

- (void)testDisconnectStopsTimersAndReleasesTheBridgeContext {
  JSContext *context = [[self contextForScene:self.first] retain];
  KrollContext *kroll = [self.first.krollBridge.krollContext retain];
  [context evaluateScript:@"var ticks = 0; setInterval(() => ticks++, 10);"];
  [self.first sceneDidDisconnect:nil];
  XCTAssertFalse(kroll.running);
  XCTAssertNil(self.first.krollBridge);
  XCTestExpectation *stopped =
      [self expectationWithDescription:@"timers stopped"];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 100 * NSEC_PER_MSEC),
                 dispatch_get_main_queue(), ^{
                   XCTAssertEqual([context[@"ticks"] toInt32], 0);
                   XCTAssertEqual(kroll.context, NULL);
                   [stopped fulfill];
                 });
  [self waitForExpectations:@[ stopped ] timeout:2];
  [context release];
  [kroll release];
}
@end
