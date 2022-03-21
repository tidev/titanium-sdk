#import "KrollPromise.h"
#import "KrollObject.h"
#import "TiExceptionHandler.h"

@implementation KrollPromise

- (KrollPromise *)initInContext:(JSContext *)context
{
  if (self = [super init]) {
    if ([KrollObject isFinalizing]) {
      // We cannot create a Promise in this context! If an object is being finalized the function
      // we call to generate a Promise will crash complaining about the Promise constructor not being an object!
      return self;
    }
    if (@available(iOS 13, *)) {
      // Use iOS 13 APIs.
      JSObjectRef resolve;
      JSObjectRef reject;
      JSValueRef exception = NULL;
      JSObjectRef promiseRef = JSObjectMakeDeferredPromise(context.JSGlobalContextRef, &resolve, &reject, &exception);
      if (exception) {
        // report exception
        JSValue *error = [JSValue valueWithJSValueRef:exception inContext:context];
        [context setException:error];
        _JSValue = [[JSValue valueWithUndefinedInContext:context] retain];
        resolveFunc = [[JSValue valueWithUndefinedInContext:context] retain];
        rejectFunc = [[JSValue valueWithUndefinedInContext:context] retain];
        return self; // all bets are off!
      }

      _JSValue = [[JSValue valueWithJSValueRef:promiseRef inContext:context] retain];
      resolveFunc = [[JSValue valueWithJSValueRef:resolve inContext:context] retain];
      rejectFunc = [[JSValue valueWithJSValueRef:reject inContext:context] retain];
    } else {
      // For older iOS versions, create promise via below JS since there is no native API.
      const NSString *JS_FUNCTION_NAME = @"_createKrollPromiseHandler";
      JSValue *createPromiseHandler = context[JS_FUNCTION_NAME];
      if (createPromiseHandler.isUndefined) {
        [context evaluateScript:@"function _createKrollPromiseHandler() {"
                                 "   const handler = {};"
                                 "   handler.promise = new Promise((resolve, reject) => {"
                                 "      handler.resolve = resolve;"
                                 "      handler.reject = reject;"
                                 "   });"
                                 "   return handler;"
                                 "}"];
        createPromiseHandler = context[JS_FUNCTION_NAME];
      }
      JSValue *exception = context.exception;
      if (exception != nil) {
        [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
      }
      JSValue *handler = [createPromiseHandler callWithArguments:nil];
      _JSValue = [handler[@"promise"] retain];
      resolveFunc = [handler[@"resolve"] retain];
      rejectFunc = [handler[@"reject"] retain];
    }
  }
  return self;
}

+ (KrollPromise *)resolved:(NSArray *)arguments inContext:(JSContext *)context
{
  KrollPromise *promise = [[[KrollPromise alloc] initInContext:context] autorelease];
  [promise resolve:arguments];
  return promise;
}

+ (KrollPromise *)rejected:(NSArray *)arguments inContext:(JSContext *)context
{
  KrollPromise *promise = [[[KrollPromise alloc] initInContext:context] autorelease];
  [promise reject:arguments];
  return promise;
}

+ (KrollPromise *)rejectedWithErrorMessage:(NSString *)message inContext:(JSContext *)context
{
  KrollPromise *promise = [[[KrollPromise alloc] initInContext:context] autorelease];
  [promise rejectWithErrorMessage:message];
  return promise;
}

- (void)resolve:(NSArray *)arguments
{
  if (resolveFunc) {
    [resolveFunc callWithArguments:arguments];
  }
  _fulfilled = YES;
  if (_flushMe) {
    [self flush];
    _flushMe = NO;
  }
}

- (void)reject:(NSArray *)arguments
{
  if (rejectFunc) {
    [rejectFunc callWithArguments:arguments];
  }
  _fulfilled = YES;
  if (_flushMe) {
    [self flush];
    _flushMe = NO;
  }
}

//  We need to handle "settling" fulfillments/rejections so we don't leave unhandled rejections around
- (void)flush
{
  if (_JSValue == nil) {
    // assume no-op Promise generated during finalization
    return;
  }
  if (_fulfilled) {
    JSValue *noop = [JSValue
        valueWithObject:^() {
        }
              inContext:rejectFunc.context];
    [_JSValue invokeMethod:@"then" withArguments:@[ noop, noop ]];
  } else {
    // not yet fulfilled/rejected, so mark it to get flushed after it is
    _flushMe = YES;
  }
}

- (void)rejectWithErrorMessage:(NSString *)message
{
  if (rejectFunc) {
    JSValue *error = [JSValue valueWithNewErrorFromMessage:message inContext:rejectFunc.context];
    [self reject:@[ error ]];
  }
}

- (void)dealloc
{
  if (_JSValue) {
    [_JSValue release];
    _JSValue = nil;
  }
  if (resolveFunc) {
    [resolveFunc release];
    resolveFunc = nil;
  }
  if (rejectFunc) {
    [rejectFunc release];
    rejectFunc = nil;
  }
  [super dealloc];
}

@end
