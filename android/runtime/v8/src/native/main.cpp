#include <jni.h>
#include <v8.h>
#include <android/log.h>
#include "NativeMap.h"
#include "CopyMap.h"

using namespace v8;

#define LOG_TAG "V8Runtime"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__) 

Handle<Value> Log(const Arguments& args)
{
	HandleScope scope;
	String::Utf8Value value(args[0]);
	LOGD(*value);
	return Undefined();
}

extern "C" JNIEXPORT void JNICALL Java_org_appcelerator_kroll_testv8_TestV8Activity_test(JNIEnv *env, jclass clazz)
{
	HandleScope scope;

	Handle<ObjectTemplate> globalTemplate = ObjectTemplate::New();
	Persistent<Context> context = Context::New(NULL, globalTemplate);
	Context::Scope contextScope(context);

	const char *srcData = "var iterations = 10000;\n"
		"var start = new Date().getTime();\n"
		"for (var i = 0; i < iterations; i++) {\n"
		"  copyMap({\n"
		"    a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7',\n"
		"    property1: 'aasdf7a9s8df7a9sdfa97sd6fa9sd7f6a9sdf7a9sdf87a9s',\n"
		"    property3: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property4: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property5: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property7: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property9: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property10: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property12: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property15: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property20: 'asdfasdfasdfasdfasdfasdfasdfasdf'\n"
		"   });\n"
		"}\n"
		"var end = new Date().getTime() - start;\n"
		"log('copy took ' + end + 'ms');\n"
		"start = new Date().getTime();\n"
		"for (var i = 0; i < iterations; i++) {\n"
		"  nativeMap({\n"
		"    a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7',\n"
		"    property1: 'aasdf7a9s8df7a9sdfa97sd6fa9sd7f6a9sdf7a9sdf87a9s',\n"
		"    property3: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property4: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property5: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property7: 'bas98d7fa98sdf7a9s8df7a9s8d7f9zxcv7sa9df7a9sdf87zxc7v',\n"
		"    property9: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property10: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property12: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property15: 'sadf7a9sdf7a97sdf6asd0f80zxcv08s0f80asd8f0xc8vz9x8v08sdf',\n"
		"    property20: 'asdfasdfasdfasdfasdfasdfasdfasdf'\n"
		"   });\n"
		"}\n"
		"var end = new Date().getTime() - start;\n"
		"log('native took ' + end + 'ms');\n";

	context->Global()->Set(String::New("log"), FunctionTemplate::New(Log)->GetFunction());
	NativeMap_init(context->Global());
	CopyMap_init(context->Global());

	Local<Script> script = Script::Compile(String::New(srcData), String::New("app:/app.js"));
	script->Run();
}

