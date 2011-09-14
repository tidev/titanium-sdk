#include <v8.h>
#include <jni.h>

using namespace v8;

#include "CopyMap.h"

static jclass hashMapClass, copyMapClass;
static jmethodID hashMapCtor, hashMapPut, copyMapProcess;
JNIEnv *jniEnv;

jobject ToMap(Handle<Object> object)
{
    HandleScope scope;
    Handle<Array> names = object->GetPropertyNames();
    int len = names->Length();

    jobject hashMap = jniEnv->NewObject(hashMapClass, hashMapCtor, (jint) len);
    for (int i = 0; i < len; i++)
    {
        Handle<Value> name = names->Get(i);
        String::Value nameStr(name);
        jstring jNameStr = jniEnv->NewString(*nameStr, nameStr.length());

        Handle<Value> value = object->Get(name);
        if (value->IsString())
        {
            String::Value valueStr(name);
            jstring jValueStr = jniEnv->NewString(*valueStr, valueStr.length());
            jniEnv->CallObjectMethod(hashMap, hashMapPut, jNameStr, jValueStr);
            jniEnv->DeleteLocalRef(jValueStr);
        }
        else if (value->IsObject())
        {
            jobject map = ToMap(value->ToObject());
            jniEnv->CallObjectMethod(hashMap, hashMapPut, jNameStr, map);
            jniEnv->DeleteLocalRef(map);
        }
        jniEnv->DeleteLocalRef(jNameStr);
    }
    return hashMap;
}

Handle<Value> CopyMap(const Arguments& args)
{
    HandleScope scope;
    jobject hashMap = ToMap(args[0]->ToObject());
    jniEnv->CallStaticVoidMethod(copyMapClass, copyMapProcess, hashMap);
    jniEnv->DeleteLocalRef(hashMap);

    return args.This();
}

void CopyMap_init(Handle<Object> global)
{
    HandleScope scope;
    Handle<FunctionTemplate> tmpl = FunctionTemplate::New(CopyMap);
    global->Set(String::New("copyMap"), tmpl->GetFunction());
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_CopyMap_nativeInit(JNIEnv *env, jclass clazz)
{
    jniEnv = env;
    copyMapClass = clazz;
    copyMapProcess = env->GetStaticMethodID(copyMapClass, "process", "(Ljava/util/HashMap;)V");
    hashMapClass = env->FindClass("java/util/HashMap");
    hashMapCtor = env->GetMethodID(hashMapClass, "<init>", "(I)V");
    hashMapPut = env->GetMethodID(hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;");
}
