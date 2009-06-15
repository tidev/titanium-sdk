//
//  Appcelerator Titanium Mobile
//  Copyright (c) 2009 Appcelerator, Inc. All Rights Reserved.
//
//  WARNING: this is a generated file and should not be modified
//

#import <UIKit/UIKit.h>

int main(int argc, char *argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];

#ifdef __LOG__ID__
	#define _QUOTEME(x) #x
	#define STRING(x) _QUOTEME(x)
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *logPath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%s.log",STRING(__LOG__ID__)]];
	freopen([logPath cStringUsingEncoding:NSASCIIStringEncoding],"w+",stderr);
	NSLog(@"Application started");
#endif

    int retVal = UIApplicationMain(argc, argv, nil, nil);
    [pool release];
    return retVal;
}
