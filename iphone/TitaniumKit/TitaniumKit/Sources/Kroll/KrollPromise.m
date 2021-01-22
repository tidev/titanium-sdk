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

      JSObjectRef promiseRef = JSObjectMakeDeferredPromise(context.JSGlobalContextRef, &resolve, &reject, &exception);
      if (exception) {
        // FIXME: Randomly getting "null is not an object" and I don't know what is null here. The context? The Promise prototype?
        // report exception
        JSValue *error = [JSValue valueWithJSValueRef:exception inContext:context];
        NSLog(@"%@", error[@"message"]);
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
      // FIXME: Do we need to use a ManagedJSValue here rather than retain it? We do expose it to the JS Engine!
      _JSValue = [[createPromise callWithArguments:@[ executor ]] retain];
      resolveFunc = [executor[@"resolve"] retain];
      rejectFunc = [executor[@"reject"] retain];
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
  JSValue *error = [JSValue valueWithNewErrorFromMessage:message inContext:context];
  [promise reject:@[ error ]];
  return promise;
}

- (void)resolve:(NSArray *)arguments
{
  [resolveFunc callWithArguments:arguments];
}

- (void)reject:(NSArray *)arguments
{
  [rejectFunc callWithArguments:arguments];
}

- (void)rejectWithErrorMessage:(NSString *)message
{
  JSValue *error = [JSValue valueWithNewErrorFromMessage:message inContext:rejectFunc.context];
  [self reject:@[ error ]];
}

- (void)dealloc
{
  [_JSValue release];
  _JSValue = nil;
  [resolveFunc release];
  resolveFunc = nil;
  [rejectFunc release];
  rejectFunc = nil;
  [super dealloc];
}

@end
