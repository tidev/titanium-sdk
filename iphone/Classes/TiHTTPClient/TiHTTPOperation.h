//
//  TiHTTPOperation.h
//  Titanium
//
//  Created by Pedro Enrique on 1/22/14.
//
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

@class TiHTTPRequest;

@interface TiHTTPOperation : NSOperation

@property(nonatomic, readonly) NSURLConnection *connection;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) BOOL executing;
@property(nonatomic) BOOL ready;
@property(nonatomic) BOOL finished;
@property(nonatomic) NSInteger index;

-(id)initWithConnection:(NSURLConnection*)connection;
@end
