/**
 * Phase 0 spike for Hermes on Android. See ../../../../README.md.
 *
 * Proxy model under test:
 * - A proxy class is a plain JS constructor with a plain JS prototype object.
 *   The constructor is JS code, because Hermes does not allow "new" on a host function.
 * - Methods are host functions on the prototype.
 * - Properties are accessors on the prototype, installed with Object.defineProperty.
 * - The Java object hangs on the JS object as a jsi::NativeState that owns a global JNI reference.
 */
#include <jni.h>
#include <android/log.h>

#include <atomic>
#include <chrono>
#include <memory>
#include <string>
#include <thread>

#include <hermes/hermes.h>
#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

using namespace facebook;

#define TAG "HermesSpike"

static JavaVM* gVm = nullptr;
static jclass gProxyClass = nullptr;
static jmethodID gProxyCtor = nullptr;
static jmethodID gGetId = nullptr;
static jmethodID gGetText = nullptr;
static jmethodID gSetText = nullptr;

static std::thread::id gJsThread;
static std::atomic<int> gCreated{0};
static std::atomic<int> gFinalized{0};
static std::atomic<int> gFinalizedOffJsThread{0};
static std::string gReport;

static JNIEnv* getEnv()
{
	JNIEnv* env = nullptr;
	if (gVm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
		gVm->AttachCurrentThread(&env, nullptr);
	}
	return env;
}

static void report(const std::string& line)
{
	gReport += line;
	gReport += "\n";
}

static double nowMs()
{
	using namespace std::chrono;
	return duration<double, std::milli>(steady_clock::now().time_since_epoch()).count();
}

/** Owns the Java proxy. Hermes destroys it when it collects the JS object. */
struct JavaRef : public jsi::NativeState {
	jobject ref;

	JavaRef(JNIEnv* env, jobject local)
		: ref(env->NewGlobalRef(local))
	{
		gCreated++;
	}

	~JavaRef() override
	{
		gFinalized++;
		if (std::this_thread::get_id() != gJsThread) {
			gFinalizedOffJsThread++;
		}
		getEnv()->DeleteGlobalRef(ref);
	}
};

static void attachNewJavaProxy(jsi::Runtime& rt, const jsi::Object& target)
{
	JNIEnv* env = getEnv();
	jobject local = env->NewObject(gProxyClass, gProxyCtor);
	target.setNativeState(rt, std::make_shared<JavaRef>(env, local));
	env->DeleteLocalRef(local);
}

static std::shared_ptr<JavaRef> javaRefOf(jsi::Runtime& rt, const jsi::Value& thisVal)
{
	if (!thisVal.isObject()) {
		throw jsi::JSError(rt, "Receiver is not an object");
	}
	jsi::Object object = thisVal.asObject(rt);
	if (!object.hasNativeState<JavaRef>(rt)) {
		throw jsi::JSError(rt, "Receiver is not a proxy");
	}
	return object.getNativeState<JavaRef>(rt);
}

static jsi::Function hostFunction(jsi::Runtime& rt, const char* name, unsigned int argCount, jsi::HostFunctionType fn)
{
	return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), argCount, std::move(fn));
}

/** Installs a getter/setter pair on a prototype through Object.defineProperty. */
static void defineAccessor(jsi::Runtime& rt, const jsi::Object& proto, const char* name,
	jsi::HostFunctionType getter, jsi::HostFunctionType setter)
{
	jsi::Object descriptor(rt);
	descriptor.setProperty(rt, "get", hostFunction(rt, name, 0, std::move(getter)));
	descriptor.setProperty(rt, "set", hostFunction(rt, name, 1, std::move(setter)));
	descriptor.setProperty(rt, "enumerable", true);
	descriptor.setProperty(rt, "configurable", true);
	rt.global()
		.getPropertyAsObject(rt, "Object")
		.getPropertyAsFunction(rt, "defineProperty")
		.call(rt, proto, jsi::String::createFromAscii(rt, name), descriptor);
}

/**
 * Hermes rejects "new" on a host function ("This function cannot be used as a constructor").
 * The constructor is therefore a plain JS function that passes "this" to the native __init function.
 */
static jsi::Function makeConstructor(jsi::Runtime& rt, const char* name, const jsi::Object& proto)
{
	static const char* factorySource =
		"(function (init, name) {\n"
		"	var ctor = function () { init(this); };\n"
		"	Object.defineProperty(ctor, 'name', { value: name, configurable: true });\n"
		"	return ctor;\n"
		"})";
	jsi::Function factory = rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(factorySource), "ctor-factory.js")
		.asObject(rt).asFunction(rt);
	jsi::Function ctor = factory
		.call(rt, rt.global().getPropertyAsFunction(rt, "__init"), jsi::String::createFromAscii(rt, name))
		.asObject(rt).asFunction(rt);
	ctor.setProperty(rt, "prototype", proto);
	proto.setProperty(rt, "constructor", ctor);
	return ctor;
}

static void installBindings(jsi::Runtime& rt)
{
	jsi::Object global = rt.global();

	global.setProperty(rt, "log", hostFunction(rt, "log", 1,
		[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
			report(count > 0 ? args[0].toString(rt).utf8(rt) : "");
			return jsi::Value::undefined();
		}));

	// __init(obj): attaches a Java proxy to an object that a JS-defined constructor made.
	global.setProperty(rt, "__init", hostFunction(rt, "__init", 1,
		[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
			if (count < 1 || !args[0].isObject()) {
				throw jsi::JSError(rt, "__init needs an object");
			}
			attachNewJavaProxy(rt, args[0].asObject(rt));
			return jsi::Value::undefined();
		}));

	// View: the base proxy class with one method and one Java-backed property.
	jsi::Object viewProto(rt);
	viewProto.setProperty(rt, "nativeId", hostFunction(rt, "nativeId", 0,
		[](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value*, size_t) -> jsi::Value {
			return jsi::Value(static_cast<int>(getEnv()->CallIntMethod(javaRefOf(rt, thisVal)->ref, gGetId)));
		}));
	defineAccessor(rt, viewProto, "text",
		[](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value*, size_t) -> jsi::Value {
			JNIEnv* env = getEnv();
			jstring value = static_cast<jstring>(env->CallObjectMethod(javaRefOf(rt, thisVal)->ref, gGetText));
			const char* chars = env->GetStringUTFChars(value, nullptr);
			jsi::String result = jsi::String::createFromUtf8(rt, chars);
			env->ReleaseStringUTFChars(value, chars);
			env->DeleteLocalRef(value);
			return result;
		},
		[](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
			JNIEnv* env = getEnv();
			std::string utf8 = count > 0 ? args[0].toString(rt).utf8(rt) : "";
			jstring value = env->NewStringUTF(utf8.c_str());
			env->CallVoidMethod(javaRefOf(rt, thisVal)->ref, gSetText, value);
			env->DeleteLocalRef(value);
			return jsi::Value::undefined();
		});
	global.setProperty(rt, "View", makeConstructor(rt, "View", viewProto));

	// Label: inherits from View through the prototype chain.
	jsi::Object labelProto = jsi::Object::create(rt, jsi::Value(rt, viewProto));
	global.setProperty(rt, "Label", makeConstructor(rt, "Label", labelProto));

	// __wrap(): the path for a proxy that Java created first. Native code builds the JS object.
	global.setProperty(rt, "__wrap", hostFunction(rt, "__wrap", 0,
		[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
			jsi::Value proto = rt.global().getPropertyAsObject(rt, "Label").getProperty(rt, "prototype");
			jsi::Object object = jsi::Object::create(rt, proto);
			attachNewJavaProxy(rt, object);
			return object;
		}));

	global.setProperty(rt, "__gc", hostFunction(rt, "__gc", 0,
		[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
			rt.instrumentation().collectGarbage("spike");
			return jsi::Value::undefined();
		}));
	global.setProperty(rt, "__created", hostFunction(rt, "__created", 0,
		[](jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
			return jsi::Value(gCreated.load());
		}));
	global.setProperty(rt, "__finalized", hostFunction(rt, "__finalized", 0,
		[](jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
			return jsi::Value(gFinalized.load());
		}));
}

extern "C" JNIEXPORT jstring JNICALL
Java_ti_hermes_spike_MainActivity_nativeRun(JNIEnv* env, jclass, jstring script, jstring scriptName)
{
	gReport.clear();
	gJsThread = std::this_thread::get_id();

	const char* scriptChars = env->GetStringUTFChars(script, nullptr);
	std::string source(scriptChars);
	env->ReleaseStringUTFChars(script, scriptChars);
	const char* nameChars = env->GetStringUTFChars(scriptName, nullptr);
	std::string name(nameChars);
	env->ReleaseStringUTFChars(scriptName, nameChars);

	double t0 = nowMs();
	{
		auto config = ::hermes::vm::RuntimeConfig::Builder().withMicrotaskQueue(true).build();
		std::unique_ptr<facebook::hermes::HermesRuntime> runtime = facebook::hermes::makeHermesRuntime(config);
		jsi::Runtime& rt = *runtime;
		double t1 = nowMs();

		try {
			installBindings(rt);
			double t2 = nowMs();
			rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), name);
			double t3 = nowMs();

			// Promise jobs do not run until the embedder drains the queue.
			bool before = rt.global().getProperty(rt, "__microtaskRan").isBool()
				&& rt.global().getProperty(rt, "__microtaskRan").getBool();
			rt.drainMicrotasks();
			bool after = rt.global().getProperty(rt, "__microtaskRan").isBool()
				&& rt.global().getProperty(rt, "__microtaskRan").getBool();
			report(std::string(!before && after ? "PASS" : "FAIL")
				+ " microtasks: ran before drain=" + (before ? "true" : "false")
				+ ", after drain=" + (after ? "true" : "false"));

			report("INFO time: create runtime " + std::to_string(t1 - t0) + " ms, install bindings "
				+ std::to_string(t2 - t1) + " ms, evaluate test script from source " + std::to_string(t3 - t2) + " ms");
		} catch (const jsi::JSError& e) {
			report("FAIL uncaught JS error: " + e.getMessage());
			report(e.getStack());
		} catch (const std::exception& e) {
			report(std::string("FAIL native exception: ") + e.what());
		}

		rt.instrumentation().collectGarbage("spike-end");
		report("INFO proxies before runtime teardown: created=" + std::to_string(gCreated.load())
			+ ", finalized=" + std::to_string(gFinalized.load()));
	}
	report(std::string(gCreated.load() == gFinalized.load() ? "PASS" : "FAIL")
		+ " teardown: created=" + std::to_string(gCreated.load())
		+ ", finalized=" + std::to_string(gFinalized.load())
		+ ", finalized off the JS thread=" + std::to_string(gFinalizedOffJsThread.load()));

	__android_log_print(ANDROID_LOG_DEBUG, TAG, "report has %zu bytes", gReport.size());
	return env->NewStringUTF(gReport.c_str());
}

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*)
{
	gVm = vm;
	JNIEnv* env = getEnv();
	jclass local = env->FindClass("ti/hermes/spike/SpikeProxy");
	gProxyClass = static_cast<jclass>(env->NewGlobalRef(local));
	gProxyCtor = env->GetMethodID(gProxyClass, "<init>", "()V");
	gGetId = env->GetMethodID(gProxyClass, "getId", "()I");
	gGetText = env->GetMethodID(gProxyClass, "getText", "()Ljava/lang/String;");
	gSetText = env->GetMethodID(gProxyClass, "setText", "(Ljava/lang/String;)V");
	return JNI_VERSION_1_6;
}
