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

- (JSClassRef)constructWithContext:(JSContextRef)context
{
  static JSClassRef jsClass;

  if (!jsClass) {
    JSClassDefinition definition = kJSClassDefinitionEmpty;
    definition.className = "Worker";
    definition.initialize = TiWorker_initialize;
    definition.finalize = TiWorker_finalize;
    definition.staticFunctions = TiWorker_staticFunctions;
    definition.setProperty = TiWorker_setProperty;
    definition.callAsConstructor = TiWorker_construct;

    jsClass = JSClassCreate(&definition);
  }

  return jsClass;
}

// Worker initializer
void TiWorker_initialize(JSContextRef context, JSObjectRef object)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(JSObjectGetPrivate(object));
  // TODO: What to do here?
}

// Worker finalizer
void TiWorker_finalize(JSObjectRef object)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(JSObjectGetPrivate(object));
  // TODO: Cleanup or manually terminate here?
}

// Expose public worker APIs
JSStaticFunction TiWorker_staticFunctions[] = {
  { "postMessage", TiWorker_postMessage, kJSPropertyAttributeDontDelete },
  { "terminate", TiWorker_terminate, kJSPropertyAttributeDontDelete },
  { 0, 0, 0 }
};

// Generically set callbacks (onerror, onmessage, onmessageerror) on worker proxy
bool TiWorker_setProperty(JSContextRef jsContext, JSObjectRef object, JSStringRef prop, JSValueRef value, JSValueRef *exception)
{
  id privateObject = (__bridge id)JSObjectGetPrivate(object);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return false;
  }

  KrollObject *o = (KrollObject *)privateObject;
  @try {
    NSString *name = (__bridge NSString *)JSStringCopyCFString(kCFAllocatorDefault, prop);

    id v = TiBindingTiValueToNSObject(jsContext, value);

    if (![v isKindOfClass:[KrollCallback class]]) {
      return _ThrowException(jsContext, @"Invalid type provided, should be a callback", exception);
    }
    TiThreadPerformOnMainThread(^{
      [o setValue:v forKey:name];
    },
        YES);
    return true;
  }
  @catch (NSException *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  return false;
}

// worker.postMessage(message);
JSValueRef TiWorker_postMessage(JSContextRef context, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(JSObjectGetPrivate(thisObject));
  NSDictionary *message = TiBindingTiValueToNSDictionary(context, arguments[0]);

  [worker postMessage:message];

  return JSValueMakeUndefined(context);
}

// worker.terminate();
JSValueRef TiWorker_terminate(JSContextRef context, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  TiWorkerProxy *worker = (__bridge TiWorkerProxy *)(JSObjectGetPrivate(thisObject));
  [worker terminate:nil];

  return JSValueMakeUndefined(context);
}

// Constructor: var worker = new Worker(message);
JSObjectRef TiWorker_construct(JSContextRef context, JSObjectRef object, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  KrollContext *ctx = GetKrollContext(context);
  NSString *path = ((__bridge NSString *)JSStringCopyCFString(kCFAllocatorDefault, JSValueToStringCopy(context, arguments[0], NULL)));
  TiWorkerProxy *proxy = [[TiWorkerProxy alloc] initWithPath:path host:[(id<TiEvaluator>)[ctx delegate] host] pageContext:(id<TiEvaluator>)[ctx delegate]];

  JSObjectSetPrivate(object, (__bridge void *)(proxy));

  return object;
}

JSValueRef _ThrowException(JSContextRef ctx, NSString *message, JSValueRef *exception)
{
  JSStringRef jsString = JSStringCreateWithCFString((__bridge CFStringRef)message);
  *exception = JSValueMakeString(ctx, jsString);
  JSStringRelease(jsString);

  return JSValueMakeUndefined(ctx);
}

@end
