#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"

#include "JSException.h"

using namespace v8;

namespace titanium {

Handle<Value> JSException::fromJavaException(jthrowable javaException)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return GetJNIEnvironmentError();
	}

	if (!javaException) {
		javaException = env->ExceptionOccurred();
	}

	env->ExceptionDescribe();

	jstring message = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	return ThrowException(Exception::Error(TypeConverter::javaStringToJsString(message)));
}

}
