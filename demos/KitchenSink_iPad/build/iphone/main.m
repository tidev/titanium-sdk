//
//  Appcelerator Titanium Mobile
//  WARNING: this is a generated file and should not be modified
//

#import <UIKit/UIKit.h>
#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)

NSString * const TI_APPLICATION_DEPLOYTYPE = @"development";
NSString * const TI_APPLICATION_ID = @"com.appcelerator.titanium";
NSString * const TI_APPLICATION_PUBLISHER = @"not specified";
NSString * const TI_APPLICATION_URL = @"not specified";
NSString * const TI_APPLICATION_NAME = @"KitchenSink_iPad";
NSString * const TI_APPLICATION_VERSION = @"1.0";
NSString * const TI_APPLICATION_DESCRIPTION = @"not specified";
NSString * const TI_APPLICATION_COPYRIGHT = @"not specified";
NSString * const TI_APPLICATION_GUID = @"d3f1f7c1-d361-4432-a46a-7fd2ac779590";
BOOL const TI_APPLICATION_ANALYTICS = true;

#ifdef DEBUG
NSString * const TI_APPLICATION_RESOURCE_DIR = @"/Users/jhaynie/work/titanium_mobile/demos/KitchenSink_iPad/build/iphone/build/Debug-iphonesimulator/KitchenSink_iPad.app";
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
