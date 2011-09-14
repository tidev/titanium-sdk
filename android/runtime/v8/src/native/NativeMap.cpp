#include "NativeMap.h"
#include <jni.h>

static jclass nativeMapClass, stringClass;
static jmethodID nativeMapCtor, nativeMapProcess;
extern "C" JNIEnv *jniEnv;

Handle<Value> NativeMap(const Arguments& args)
{
    HandleScope scope;
    Handle<Object> obj = args[0]->ToObject();

    jobject nativeMap = jniEnv->NewObject(nativeMapClass, nativeMapCtor,
        reinterpret_cast<jlong>(&obj));

    jniEnv->CallStaticVoidMethod(nativeMapClass, nativeMapProcess, nativeMap);
    jniEnv->DeleteLocalRef(nativeMap);

    return args.This();
}

extern "C" jstring
Java_org_appcelerator_kroll_runtime_v8_NativeMap_nativeGet(JNIEnv *env, jobject map, jlong ptr, jstring name)
{
    HandleScope scope;
    Handle<Object>* jsObject = reinterpret_cast<Handle<Object>*>(ptr);

    const jchar *chars = jniEnv->GetStringChars(name, NULL);
    jint len = jniEnv->GetStringLength(name);

    Handle<String> value = (*jsObject)->Get(String::New(chars, len))->ToString();
    jniEnv->ReleaseStringChars(name, chars);

    String::Value v(value);
    return env->NewString(*v, v.length());
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_NativeMap_nativeSet(JNIEnv *env, jobject map, jlong ptr, jstring name, jstring value)
{
    HandleScope scope;
    Handle<Object>* jsObject = reinterpret_cast<Handle<Object>*>(ptr);

    const jchar *nameChars = jniEnv->GetStringChars(name, NULL);
    jint nameLen = jniEnv->GetStringLength(name);
    const jchar *valueChars = jniEnv->GetStringChars(value, NULL);
    jint valueLen = jniEnv->GetStringLength(value);

    (*jsObject)->Set(String::New(nameChars, nameLen), String::New(valueChars, valueLen));

    jniEnv->ReleaseStringChars(name, nameChars);
    jniEnv->ReleaseStringChars(value, valueChars);
}

extern "C" jboolean
Java_org_appcelerator_kroll_runtime_v8_NativeMap_nativeHas(JNIEnv *env, jobject map, jlong ptr, jstring name)
{
    HandleScope scope;
    Handle<Object>* jsObject = reinterpret_cast<Handle<Object>*>(ptr);

    const jchar *chars = jniEnv->GetStringChars(name, NULL);
    jint len = jniEnv->GetStringLength(name);

    bool hasProperty = (*jsObject)->Has(String::New(chars, len));
    jniEnv->ReleaseStringChars(name, chars);
    return (jboolean) hasProperty;
}

extern "C" jobjectArray
Java_org_appcelerator_kroll_runtime_v8_NativeMap_nativeKeys(JNIEnv *env, jobject map, jlong ptr)
{
    HandleScope scope;
    Handle<Object>* jsObject = reinterpret_cast<Handle<Object>*>(ptr);

    Handle<Array> names = (*jsObject)->GetPropertyNames();
    int len = names->Length();
    jobjectArray keys = env->NewObjectArray(len, stringClass, NULL);

    for (int i = 0; i < len; i++) {
        String::Value name(names->Get(i));
        env->SetObjectArrayElement(keys, (jint) i,
            env->NewString(*name, name.length()));
    }
    return keys;
}

void NativeMap_init(Handle<Object> global)
{
    HandleScope scope;
    Handle<FunctionTemplate> tmpl = FunctionTemplate::New(NativeMap);
    global->Set(String::New("nativeMap"), tmpl->GetFunction());
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_NativeMap_nativeInit(JNIEnv *env, jclass clazz)
{
    nativeMapClass = clazz;
    nativeMapProcess = env->GetStaticMethodID(nativeMapClass, "process", "(Lorg/appcelerator/kroll/runtime/v8/NativeMap;)V");
    nativeMapCtor = env->GetMethodID(nativeMapClass, "<init>", "(J)V");
    stringClass = env->FindClass("java/lang/String");
}

