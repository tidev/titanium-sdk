#ifndef TYPECONVERTER_H
#define TYPECONVERTER_H

#include <jni.h>
#include <v8/v8.h>


namespace titanium
{
	class TypeConverter
	{
		public:
			static JNIEnv *env;

			// util methods
			static void initEnv (JNIEnv *env);
			static jobject jsValueToJavaObject (v8::Local<v8::Value> jsValue);

			// javascript to java convert methods
			static jshort jsNumberToJavaShort (v8::Handle<v8::Number> jsNumber);
			static v8::Handle<v8::Number> javaShortToJsNumber (jshort javaShort);

			static jint jsNumberToJavaInt (v8::Handle<v8::Number> jsNumber);
			static v8::Handle<v8::Number> javaIntToJsNumber (jint javaInt);

			static jlong jsNumberToJavaLong (v8::Handle<v8::Number> jsNumber);
			static v8::Handle<v8::Number> javaLongToJsNumber (jlong javaLong);

			static jfloat jsNumberToJavaFloat (v8::Handle<v8::Number> jsNumber);
			static v8::Handle<v8::Number> javaFloatToJsNumber (jfloat javaFloat);

			static jdouble jsNumberToJavaDouble (v8::Handle<v8::Number> jsNumber);
			static v8::Handle<v8::Number> javaDoubleToJsNumber (jdouble javaDouble);

			static jboolean jsBooleanToJavaBoolean (v8::Handle<v8::Boolean> jsBoolean);
			static v8::Handle<v8::Boolean> javaBooleanToJsBoolean (jboolean javaBoolean);

			static jstring jsStringToJavaString (v8::Handle<v8::String> jsString);
			static v8::Handle<v8::String> javaStringToJsString (jstring javaString);

			static jarray jsArrayToJavaArray (v8::Handle<v8::Array>);
			static v8::Handle<v8::Array> javaArrayToJsArray (jbooleanArray javaBooleanArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jshortArray javaShortArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jintArray javaIntArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jlongArray javaLongArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jfloatArray javaFloatArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jdoubleArray javaDoubleArray);
			static v8::Handle<v8::Array> javaArrayToJsArray (jobjectArray javaObjectArray);

			static jobject jsDateToJavaDate (v8::Handle<v8::Date> jsDate);
			static jlong jsDateToJavaLong (v8::Handle<v8::Date> jsDate);

			static v8::Handle<v8::Date> javaDateToJsDate (jobject);
			static v8::Handle<v8::Date> javaLongToJsDate (jlong);

			static jobject getJavaUndefined();
	};
}

#endif


