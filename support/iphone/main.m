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

#ifdef DEBUG
NSString * const TI_APPLICATION_RESOURCE_DIR = @"__APP_RESOURCE_DIR__";
#endif

int main(int argc, char *argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];

#ifdef __LOG__ID__
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *logPath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%s.log",STRING(__LOG__ID__)]];
	freopen([logPath cStringUsingEncoding:NSUTF8StringEncoding],"w+",stderr);
	fprintf(stderr,"[INFO] Application started\n");
#endif

    int retVal = UIApplicationMain(argc, argv, nil, nil);
    [pool release];
    return retVal;
}
