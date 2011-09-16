#ifndef V8_RUNTIME_H
#define V8_RUNTIME_H

#include <jni.h>
#include <v8.h>

using namespace v8;

namespace titanium
{
	class V8Runtime
	{
	public:
		static jobject newObject(Handle<Object> object);
		static void collectWeakRef(Persistent<Value> ref, void *parameter);
		static void initNativeModules(Handle<Object> global);
	};
};

#endif
