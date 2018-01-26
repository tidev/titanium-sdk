//
//  TiWorkerJS.m
//  Titanium
//
//  Created by Hans Knöchel on 26.01.18.
//

#import "TiWorkerJS.h"
#import "TiBindingTiValue.h"
#import "TiWorkerProxy.h"

@implementation TiWorkerJS

- (TiClassRef)constructWithContext:(TiContextRef)context
{
  static TiClassRef jsClass;
  if (!jsClass) {
    TiClassDefinition definition = kTiClassDefinitionEmpty;
    definition.className = "Worker";
    definition.initialize = TiWorker_initialize;
    definition.finalize = TiWorker_finalize;
    definition.staticFunctions = TiWorker_staticFunctions;
    definition.setProperty = TiWorker_setProperty;
    definition.callAsConstructor = TiWorker_construct;

    jsClass = TiClassCreate(&definition);
  }

  return jsClass;
}

// Worker initializer
void TiWorker_initialize(TiContextRef context, TiObjectRef object)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(TiObjectGetPrivate(object));
  // TODO: What to do here?
}

// Worker finalizer
void TiWorker_finalize(TiObjectRef object)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(TiObjectGetPrivate(object));
  // TODO: Cleanup or manually terminate here?
}

// Expose public worker APIs
TiStaticFunction TiWorker_staticFunctions[] = {
  { "postMessage", TiWorker_postMessage, kTiPropertyAttributeDontDelete },
  { "terminate", TiWorker_terminate, kTiPropertyAttributeDontDelete },
  { 0, 0, 0 }
};

// Generically set callbacks (onerror, onmessage, onmessageerror) on worker proxy
bool TiWorker_setProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef value, TiValueRef *exception)
{
  id privateObject = (__bridge id)TiObjectGetPrivate(object);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return false;
  }

  KrollObject *o = (KrollObject *)privateObject;
  @try {
    NSString *name = (__bridge NSString *)TiStringCopyCFString(kCFAllocatorDefault, prop);

    id v = TiBindingTiValueToNSObject(jsContext, value);

    if (![v isKindOfClass:[KrollCallback class]]) {
      return _ThrowException(jsContext, @"Invalid type provided, should be a callback", exception);
    }
#ifdef TI_USE_KROLL_THREAD
    [o setValue:v
          forKey:name];
#else
    TiThreadPerformOnMainThread(^{
      [o setValue:v forKey:name];
    },
        YES);
#endif
    return true;
  }
  @catch (NSException *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  return false;
}

// worker.postMessage(message);
TiValueRef TiWorker_postMessage(TiContextRef context, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef *exception)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(TiObjectGetPrivate(thisObject));
  NSDictionary *message = TiBindingTiValueToNSDictionary(context, arguments[0]);

  [worker postMessage:message];

  return TiValueMakeUndefined(context);
}

// worker.terminate();
TiValueRef TiWorker_terminate(TiContextRef context, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef *exception)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(TiObjectGetPrivate(thisObject));
  [worker terminate:nil];

  return TiValueMakeUndefined(context);
}

// Constructor: var worker = new Worker(message);
TiObjectRef TiWorker_construct(TiContextRef context, TiObjectRef object, size_t argumentCount, const TiValueRef arguments[], TiValueRef *exception)
{
  KrollContext *ctx = GetKrollContext(context);
  NSString *path = ((__bridge NSString *)TiStringCopyCFString(kCFAllocatorDefault, TiValueToStringCopy(context, arguments[0], NULL)));
  TiWorkerProxy *proxy = [[TiWorkerProxy alloc] initWithPath:path host:[(id<TiEvaluator>)[ctx delegate] host] pageContext:(id<TiEvaluator>)[ctx delegate]];

  TiObjectSetPrivate(object, (__bridge void *)(proxy));

  return object;
}

TiValueRef _ThrowException(TiContextRef ctx, NSString *message, TiValueRef *exception)
{
  TiStringRef jsString = TiStringCreateWithCFString((__bridge CFStringRef)message);
  *exception = TiValueMakeString(ctx, jsString);
  TiStringRelease(jsString);
  return TiValueMakeUndefined(ctx);
}

@end
