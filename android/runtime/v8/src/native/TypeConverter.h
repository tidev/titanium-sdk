#ifndef TYPECONVERTER_H
#define TYPECONVERTER_H

#include <jni.h>


class TypeConverter
{
	public:
		// javascript to java convert methods
		static jshort jsNumberToJavaShort (v8::Number);
		static jint jsNumberToJavaInt (v8::Number);
		static jlong jsNumberToJavaLong (v8::Number);
		static jfloat jsNumberToJavaFloat (v8::Number);
		static jdouble jsNumberToJavaDouble (v8::Number);
		static jboolean jsBooleanToJavaBoolean (v8::Boolean);
		static jstring jsStringToJavaString (v8::String);
		static jarray jsArrayJavaArray (v8::Array);
		//static  jsDateToJavaDate (v8::Date);
		//static jlong jsDateToJavextern aLong (v8::????);
		//static ? jsUndefinedToJavaUndefined();

		// java to javascript convert methods
		static v8::Number javaShortToJsNumber (jshort);
		static v8::Number javaIntToJsNumber (jint);
		static v8::Number javaLongToJsNumber (jlong);
		static v8::Number javaFloatToJsNumber (jfloat);
		static v8::Number javaDoubleToJsNumber (jdouble);
		static v8::Boolean jboolean javaBooleanToJsBoolean (jboolean);
		static v8::String javaStringToJsString (jstring);
		static v8:: javaArrayJsArray (jarray);
		//static ? javaDateToJsDate (v8::????);
		//static jlong javaLongToJsDate (v8::????);
		//static ? javaUndefinedToJsUndefined();
};


#endif


