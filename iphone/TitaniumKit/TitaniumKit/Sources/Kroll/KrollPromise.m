#import "KrollPromise.h"
#import "TiExceptionHandler.h"

@implementation KrollPromise

- (KrollPromise *)initInContext:(JSContext *)context
{
  if (self = [super init]) {
    if (@available(iOS 13, *)) {
      // Use iOS 13 APIs.
      JSObjectRef resolve;
      JSObjectRef reject;
      JSValueRef exception = NULL;
      _JSValue = [JSValue valueWithJSValueRef:JSObjectMakeDeferredPromise(context.JSGlobalContextRef, &resolve, &reject, &exception) inContext:context];
      if (exception) {
        // report exception
        [TiExceptionHandler.defaultExceptionHandler reportScriptError:[JSValue valueWithJSValueRef:exception inContext:context] inJSContext:context];
      }
      resolveFunc = [[JSValue valueWithJSValueRef:resolve inContext:context] retain];
      rejectFunc = [[JSValue valueWithJSValueRef:reject inContext:context] retain];
    } else {
      // Alternative code for earlier versions of iOS. We hack it by evaluating JS
      // TODO: I assume this is pretty slow. Can we re-use eval'd values here?
      JSValue *executor = [context evaluateScript:@"function executor(resolve, reject) { executor.resolve = resolve; executor.reject = reject; }\nexecutor;"];
      JSValue *exception = context.exception;
      if (exception != nil) {
        [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
      }
      JSValue *createPromise = [context evaluateScript:@"function createPromise(executor) { return new Promise(executor); }\ncreatePromise;"];
      exception = context.exception;
      if (exception != nil) {
        [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
      }
      _JSValue = [createPromise callWithArguments:@[ executor ]];
      resolveFunc = [executor[@"resolve"] retain];
      rejectFunc = [executor[@"reject"] retain];
    }
  }
  return self;
}

+ (JSValue *)resolved:(NSArray *)arguments inContext:(JSContext *)context
{
  KrollPromise *promise = [[[KrollPromise alloc] initInContext:context] autorelease];
  [promise resolve:arguments];
  return promise.JSValue;
}

+ (JSValue *)rejected:(NSArray *)arguments inContext:(JSContext *)context
{
  KrollPromise *promise = [[[KrollPromise alloc] initInContext:context] autorelease];
  [promise reject:arguments];
  return promise.JSValue;
}

- (void)resolve:(NSArray *)arguments
{
  [resolveFunc callWithArguments:arguments];
}

- (void)reject:(NSArray *)arguments
{
  [rejectFunc callWithArguments:arguments];
}

- (void)dealloc
{
  [resolveFunc release];
  [rejectFunc release];
  [super dealloc];
}

@end
