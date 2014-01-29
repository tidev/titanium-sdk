//
//  TiHelper.h
//  HTTPClient
//
//  Created by Pedro Enrique on 1/20/14.
//  Copyright (c) 2014 Pedro Enrique. All rights reserved.
//

#import <Foundation/Foundation.h>

#ifndef PELog
#define PELog(...) {\
/*NSLog(__VA_ARGS__);*/\
}
#endif
#ifndef RELEASE_TO_NIL
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif

@interface TiHTTPHelper : NSObject

+(NSString *)base64encode:(NSData *)plainText;

@end
