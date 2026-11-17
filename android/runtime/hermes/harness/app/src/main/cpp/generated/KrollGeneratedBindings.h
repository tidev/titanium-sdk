// Harness stand-in for the binding code that kroll-apt generates in Phase 3.
// It binds the Java classes of the harness by hand, in the way that generated code will.
#ifndef HARNESS_GENERATED_BINDINGS_H
#define HARNESS_GENERATED_BINDINGS_H

#include <cstring>
#include <string>

#include "JNIUtil.h"
#include "JSException.h"
#include "KrollBindings.h"
#include "Proxy.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

namespace titanium {

#define HARNESS_CLASS(Name, JavaName, Parent, Install, IsModule, Indexed, Interceptor) \
class Name { public: \
	static ProxyClass& getProxyClass() { \
		static ProxyClass c = { #Name, JavaName, Parent, Install, IsModule, Indexed, Interceptor, nullptr }; \
		return c; \
	} \
	static void bindProxy(jsi::Runtime& rt, const jsi::Object& exports) { Proxy::bindClass(rt, exports, getProxyClass()); } \
	static void dispose(jsi::Runtime& rt) { Proxy::disposeClass(rt, getProxyClass()); } \
};

// Calls a Java method of the proxy behind "thisVal". Every argument and the result are Objects.
static inline jsi::Value harnessCall(jsi::Runtime& rt, const jsi::Value& thisVal, ProxyClass& proxyClass,
	const char* name, const char* signature, const jsi::Value* args, size_t argCount, bool hasResult)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}
	Proxy* proxy = Proxy::unwrap(rt, thisVal, proxyClass);
	if (!proxy) {
		return jsi::Value::undefined();
	}
	jmethodID methodID = env->GetMethodID(proxyClass.javaClass, name, signature);
	if (!methodID) {
		env->ExceptionClear();
		JSException::Error(rt, "Couldn't find proxy method");
	}

	jvalue jArguments[2];
	bool isNew[2] = { false, false };
	for (size_t i = 0; i < argCount && i < 2; i++) {
		jArguments[i].l = TypeConverter::jsValueToJavaObject(rt, env, args[i], &isNew[i]);
	}

	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy == NULL) {
		return jsi::Value::undefined();
	}
	jobject jResult = NULL;
	if (hasResult) {
		jResult = env->CallObjectMethodA(javaProxy, methodID, jArguments);
	} else {
		env->CallVoidMethodA(javaProxy, methodID, jArguments);
	}
	proxy->unreferenceJavaObject(javaProxy);
	for (size_t i = 0; i < argCount && i < 2; i++) {
		if (isNew[i]) {
			env->DeleteLocalRef(jArguments[i].l);
		}
	}
	JSException::checkJavaException(rt, env);

	if (!hasResult) {
		return jsi::Value::undefined();
	}
	jsi::Value result = TypeConverter::javaObjectToJsValue(rt, env, jResult);
	if (jResult) {
		env->DeleteLocalRef(jResult);
	}
	return result;
}

HARNESS_CLASS(KrollProxy, "org/appcelerator/kroll/KrollProxy", nullptr, nullptr, false, false, nullptr)
static inline ProxyClass* harnessKrollProxyClass() { return &KrollProxy::getProxyClass(); }
HARNESS_CLASS(KrollModule, "org/appcelerator/kroll/KrollProxy", harnessKrollProxyClass, nullptr, false, false, nullptr)
static inline ProxyClass* harnessKrollModuleClass() { return &KrollModule::getProxyClass(); }
static inline ProxyClass& harnessModuleClass();

// A module method. JS code can call it without a receiver, so it unwraps with the module class.
static inline jsi::Value TitaniumModule_echo(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count)
{
	jsi::Value padded[1] = { count > 0 ? jsi::Value(rt, args[0]) : jsi::Value::undefined() };
	return harnessCall(rt, thisVal, harnessModuleClass(), "echo", "(Ljava/lang/Object;)Ljava/lang/Object;", padded, 1, true);
}

static inline void TitaniumModule_install(ClassBuilder& builder)
{
	builder.method("echo", TitaniumModule_echo, 1);
}

HARNESS_CLASS(TitaniumModule, "ti/harness/TestProxy", harnessKrollModuleClass, TitaniumModule_install, true, false, nullptr)
static inline ProxyClass& harnessModuleClass() { return TitaniumModule::getProxyClass(); }

static inline ProxyClass& harnessTestProxyClass();

#define HARNESS_METHOD(Function, JavaName, Signature, ArgCount, HasResult) \
static inline jsi::Value Function(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) { \
	jsi::Value padded[2]; \
	for (size_t i = 0; i < ArgCount; i++) { padded[i] = i < count ? jsi::Value(rt, args[i]) : jsi::Value::undefined(); } \
	return harnessCall(rt, thisVal, harnessTestProxyClass(), JavaName, Signature, padded, ArgCount, HasResult); \
}

HARNESS_METHOD(TestProxy_echo, "echo", "(Ljava/lang/Object;)Ljava/lang/Object;", 1, true)
HARNESS_METHOD(TestProxy_describe, "describe", "(Ljava/lang/Object;)Ljava/lang/String;", 1, true)
HARNESS_METHOD(TestProxy_keepInJava, "keepInJava", "()V", 0, false)
HARNESS_METHOD(TestProxy_callBack, "callBack", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;", 2, true)
HARNESS_METHOD(TestProxy_fail, "fail", "(Ljava/lang/String;)V", 1, false)
HARNESS_METHOD(TestProxy_makeChild, "makeChild", "()Ljava/lang/Object;", 0, true)
HARNESS_METHOD(TestProxy_creationInfo, "creationInfo", "()[Ljava/lang/Object;", 0, true)

static inline jsi::Value TestProxy_getText(jsi::Runtime& rt, const jsi::Value& thisVal)
{
	return harnessCall(rt, thisVal, harnessTestProxyClass(), "getText", "()Ljava/lang/String;", nullptr, 0, true);
}

static inline void TestProxy_setText(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value& value)
{
	jsi::Value args[1] = { jsi::Value(rt, value) };
	harnessCall(rt, thisVal, harnessTestProxyClass(), "setText", "(Ljava/lang/String;)V", args, 1, false);
}

static inline jsi::Value TestProxy_getFive(jsi::Runtime& rt, const jsi::Value& thisVal)
{
	return jsi::Value(5);
}

static inline void TestProxy_install(ClassBuilder& builder)
{
	builder.method("echo", TestProxy_echo, 1);
	builder.method("describe", TestProxy_describe, 1);
	builder.method("keepInJava", TestProxy_keepInJava, 0);
	builder.method("callBack", TestProxy_callBack, 2);
	builder.method("fail", TestProxy_fail, 1);
	builder.method("makeChild", TestProxy_makeChild, 0);
	builder.method("creationInfo", TestProxy_creationInfo, 0);
	// A property with a Java getter and a Java setter.
	builder.accessor("text", TestProxy_getText, TestProxy_setText);
	// A property without Java accessors: JS stores it, and Java gets onPropertyChanged().
	builder.accessor("title", nullptr, nullptr);
	builder.accessor("five", TestProxy_getFive, nullptr, true);
	builder.constant("TEN", jsi::Value(10));
	builder.staticConstant("ELEVEN", jsi::Value(11));
}

HARNESS_CLASS(TestProxy, "ti/harness/TestProxy", harnessKrollProxyClass, TestProxy_install, false, false, nullptr)
static inline ProxyClass& harnessTestProxyClass() { return TestProxy::getProxyClass(); }
static inline ProxyClass* harnessTestProxyParent() { return &TestProxy::getProxyClass(); }

HARNESS_CLASS(IndexedProxy, "ti/harness/IndexedProxy", harnessTestProxyParent, nullptr, false, true, nullptr)

// Handles property names that start with "x". Passes every other name on.
static inline jsi::Value harnessIntercept(jsi::Runtime& rt, Proxy* proxy, const jsi::String& name)
{
	std::string property = name.utf8(rt);
	if (!property.empty() && property[0] == 'x') {
		return jsi::String::createFromUtf8(rt, "intercepted:" + property);
	}
	return jsi::Value(rt, TiRuntime::state->dontIntercept);
}

HARNESS_CLASS(InterceptProxy, "ti/harness/InterceptProxy", harnessTestProxyParent, nullptr, false, false, harnessIntercept)

namespace bindings {

class generated
{
public:
	static BindEntry* lookupGeneratedInit(const char* name, unsigned int length)
	{
		static BindEntry entries[] = {
			{ "org.appcelerator.kroll.KrollProxy", KrollProxy::bindProxy, KrollProxy::dispose },
			{ "ti.harness.TestProxy", TestProxy::bindProxy, TestProxy::dispose },
			{ "ti.harness.IndexedProxy", IndexedProxy::bindProxy, IndexedProxy::dispose },
			{ "ti.harness.InterceptProxy", InterceptProxy::bindProxy, InterceptProxy::dispose }
		};
		for (BindEntry& entry : entries) {
			if (strcmp(name, entry.name) == 0) {
				return &entry;
			}
		}
		return nullptr;
	}
};

} // namespace bindings

} // namespace titanium

#endif
