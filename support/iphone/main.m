//
//  Titanium SDK
//  WARNING: this is a generated file and should not be modified
//

#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiLogServer.h>
#import <TitaniumKit/TiSharedConfig.h>

NSString *const TI_APPLICATION_DEPLOY_TYPE = @"__DEPLOY_TYPE__";
NSString *const TI_APPLICATION_ID = @"__APP_ID__";
NSString *const TI_APPLICATION_PUBLISHER = @"__APP_PUBLISHER__";
NSString *const TI_APPLICATION_URL = @"__APP_URL__";
NSString *const TI_APPLICATION_NAME = @"__APP_NAME__";
NSString *const TI_APPLICATION_VERSION = @"__APP_VERSION__";
NSString *const TI_APPLICATION_DESCRIPTION = @"__APP_DESCRIPTION__";
NSString *const TI_APPLICATION_COPYRIGHT = @"__APP_COPYRIGHT__";
NSString *const TI_APPLICATION_GUID = @"__APP_GUID__";
BOOL const TI_APPLICATION_SHOW_ERROR_CONTROLLER = __SHOW_ERROR_CONTROLLER__;
NSString *const TI_APPLICATION_BUILD_TYPE = @"__BUILD_TYPE__";
#ifdef TARGET_OS_SIMULATOR
NSString *const TI_APPLICATION_RESOURCE_DIR = @"__APP_RESOURCE_DIR__";
#endif
NSString *const TI_LOG_ID = @"__LOG_ID__";
NSUInteger const TI_LOG_SERVER_PORT = __TI_LOG_SERVER_PORT__ ? __TI_LOG_SERVER_PORT__ : 10571;
CGFloat const TI_APPLICATION_DEFAULT_BGCOLOR_RED = __APP_DEFAULT_BGCOLOR_RED__;
CGFloat const TI_APPLICATION_DEFAULT_BGCOLOR_GREEN = __APP_DEFAULT_BGCOLOR_GREEN__;
CGFloat const TI_APPLICATION_DEFAULT_BGCOLOR_BLUE = __APP_DEFAULT_BGCOLOR_BLUE__;

int main(int argc, char *argv[])
{
  [[TiSharedConfig defaultConfig] setApplicationDeployType:TI_APPLICATION_DEPLOY_TYPE];
  [[TiSharedConfig defaultConfig] setApplicationID:TI_APPLICATION_ID];
  [[TiSharedConfig defaultConfig] setApplicationPublisher:TI_APPLICATION_PUBLISHER];
  [[TiSharedConfig defaultConfig] setApplicationURL:[NSURL URLWithString:TI_APPLICATION_URL]];
  [[TiSharedConfig defaultConfig] setApplicationName:TI_APPLICATION_NAME];
  [[TiSharedConfig defaultConfig] setApplicationVersion:TI_APPLICATION_VERSION];
  [[TiSharedConfig defaultConfig] setApplicationDescription:TI_APPLICATION_DESCRIPTION];
  [[TiSharedConfig defaultConfig] setApplicationCopyright:TI_APPLICATION_COPYRIGHT];
  [[TiSharedConfig defaultConfig] setApplicationGUID:TI_APPLICATION_GUID];
  [[TiSharedConfig defaultConfig] setShowErrorController:TI_APPLICATION_SHOW_ERROR_CONTROLLER];
  [[TiSharedConfig defaultConfig] setApplicationBuildType:TI_APPLICATION_BUILD_TYPE];
  [[TiSharedConfig defaultConfig] setApplicationResourcesDirectory:TI_APPLICATION_RESOURCE_DIR];
#ifdef DISABLE_TI_LOG_SERVER
  [[TiSharedConfig defaultConfig] setLogServerEnabled:NO];
#else
  [[TiSharedConfig defaultConfig] setLogServerEnabled:YES];
  [[TiLogServer defaultLogServer] setPort:TI_LOG_SERVER_PORT];
#endif

  UIColor *defaultBgColor = [UIColor colorWithRed:TI_APPLICATION_DEFAULT_BGCOLOR_RED
                                            green:TI_APPLICATION_DEFAULT_BGCOLOR_GREEN
                                             blue:TI_APPLICATION_DEFAULT_BGCOLOR_BLUE
                                            alpha:1.0f];
  [[TiSharedConfig defaultConfig] setDefaultBackgroundColor:defaultBgColor];

#if defined(DEBUG) || defined(DEVELOPER)
  [[TiSharedConfig defaultConfig] setDebugEnabled:YES];
#endif

#ifdef LOGTOFILE
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *documentsDirectory = [paths objectAtIndex:0];
  NSString *logPath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.log", TI_LOG_ID]];
  freopen([logPath cStringUsingEncoding:NSUTF8StringEncoding], "w+", stderr);
  fprintf(stderr, "[INFO] Application started\n");
#endif

  NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
  int retVal = UIApplicationMain(argc, argv, @"TiUIApplication", @"TiApp");
  [pool release];
  return retVal;
}
