#ifndef TYPECONVERTER_H
#define TYPECONVERTER_H

#include <string>

#include <jni.h>
#include <v8/v8.h>

using namespace std;


class TypeConverter
{
	public:
		static JNIEnv *env;

		static void initEnv (JNIEnv *env);

		static jclass getJavaClass (string className);
		static jmethodID getJavaMethodId (jclass javaClass, string methodName, string methodSignature);

		// javascript to java convert methods
		static jshort jsNumberToJavaShort (v8::Handle<v8::Number> jsNumber);
		static v8::Handle<v8::Number> javaShortToJsNumber(jshort javaShort);

		static jint jsNumberToJavaInt (v8::Handle<v8::Number> jsNumber);
		static v8::Handle<v8::Number> javaIntToJsNumber(jint javaInt);

		static jlong jsNumberToJavaLong (v8::Handle<v8::Number> jsNumber);
		static v8::Handle<v8::Number> javaLongToJsNumber(jlong javaLong);

		static jfloat jsNumberToJavaFloat (v8::Handle<v8::Number> jsNumber);
		static v8::Handle<v8::Number> javaFloatToJsNumber(jfloat javaFloat);

		static jdouble jsNumberToJavaDouble (v8::Handle<v8::Number> jsNumber);
		static v8::Handle<v8::Number> javaDoubleToJsNumber(jdouble javaDouble);

		static jboolean jsBooleanToJavaBoolean (v8::Handle<v8::Boolean> jsBoolean);
		static v8::Handle<v8::Boolean> javaBooleanToJsBoolean(jboolean javaBoolean);

		static jstring jsStringToJavaString (v8::Handle<v8::String> jsString);
		static v8::Handle<v8::String> javaStringToJsString(jstring javaString);

		static jarray jsArrayToJavaArray (v8::Handle<v8::Array>);

		//static  jsDateToJavaDate (v8::Date);
		//static jlong jsDateToJavextern aLong (v8::????);
		//static ? jsUndefinedToJavaUndefined();

		// java to javascript convert methods
/*		static v8::Handle<v8::Number> javaShortToJsNumber (jshort);
		static v8::Handle<v8::Number> javaIntToJsNumber (jint);
		static v8::Handle<v8::Number> javaLongToJsNumber (jlong);
		static v8::Handle<v8::Number> javaFloatToJsNumber (jfloat);
		static v8::Handle<v8::Number> javaDoubleToJsNumber (jdouble);
		static v8::Handle<v8::Boolean> jboolean javaBooleanToJsBoolean (jboolean);
		static v8::Handle<v8::String> javaStringToJsString (jstring);
		static v8::Handle<v8::Array> javaArrayJsArray (jarray);
*/
		//static ? javaDateToJsDate (v8::????);
		//static jlong javaLongToJsDate (v8::????);
		//static ? javaUndefinedToJsUndefined();
};


#endif


