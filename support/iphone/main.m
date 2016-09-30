//
//  Appcelerator Titanium Mobile
//  WARNING: this is a generated file and should not be modified
//

#import <UIKit/UIKit.h>
#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)

NSString * const TI_APPLICATION_DEPLOYTYPE = @"__DEPLOYTYPE__";
NSString * const TI_APPLICATION_ID = @"__APP_ID__";
NSString * const TI_APPLICATION_PUBLISHER = @"__APP_PUBLISHER__";
NSString * const TI_APPLICATION_URL = @"__APP_URL__";
NSString * const TI_APPLICATION_NAME = @"__APP_NAME__";
NSString * const TI_APPLICATION_VERSION = @"__APP_VERSION__";
NSString * const TI_APPLICATION_DESCRIPTION = @"__APP_DESCRIPTION__";
NSString * const TI_APPLICATION_COPYRIGHT = @"__APP_COPYRIGHT__";
NSString * const TI_APPLICATION_GUID = @"__APP_GUID__";
BOOL const TI_APPLICATION_ANALYTICS = __APP_ANALYTICS__;
BOOL const TI_APPLICATION_SHOW_ERROR_CONTROLLER = __SHOW_ERROR_CONTROLLER__;
NSString * const TI_APPLICATION_BUILD_TYPE = @"__APP_DEPLOY_TYPE__";

#ifdef TARGET_IPHONE_SIMULATOR
NSString * const TI_APPLICATION_RESOURCE_DIR = @"__APP_RESOURCE_DIR__";
#endif

int main(int argc, char *argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];

	int retVal = UIApplicationMain(argc, argv, nil, @"TiApp");
    [pool release];
    return retVal;
}
