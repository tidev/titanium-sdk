#include <string>
#include <jni.h>

#include <TypeConverter.h>

using namespace std;


JNIEnv *TypeConverter::env;

void TypeConverter::initEnv(JNIEnv *env)
{
	TypeConverter::env = env;
}


jclass TypeConverter::getJavaClass (String className)
{
	jclass javaClass = TypeConverter::env->FindClass (className);
	if (javaClass == NULL)
	{
		return NULL; // exception thrown
	}

	return javaClass;
}


jmethodID TypeConverter::getJavaMethodId (jclass javaClass, String methodName, String methodSignature)
{
	jmethodID javaMethodId = TypeConverter::env->GetMethodID (javaClass, methodName, methodSignature);
	if (javaMethodId == NULL)
	{
		return NULL;
	}

	return javaMethodId;
}


jshort TypeConverter::jsNumberToJavaShort(v8::Handle<v8::Number> jsNumber)
{
	return ((jshort) jsNumber->Value());
}


v8::Handle<v8::Number> TypeConverter::javaShortToJsNumber(jshort javaShort)
{
	return v8::Number::New ((double) javaShort);
}


jint TypeConverter::jsNumberToJavaInt(v8::Handle<v8::Number> jsNumber)
{
	return ((jint) jsNumber->Value());
}


v8::Handle<v8::Number> TypeConverter::javaIntToJsNumber(jint javaInt)
{
	return v8::Number::New ((double) javaInt);
}


jlong TypeConverter::jsNumberToJavaLong(v8::Handle<v8::Number> jsNumber)
{
	return ((jlong) jsNumber->Value());
}


v8::Handle<v8::Number> TypeConverter::javaLongToJsNumber(jlong javaLong)
{
	return v8::Number::New ((double) javaLong);
}


jfloat TypeConverter::jsNumberToJavaFloat(v8::Handle<v8::Number> jsNumber)
{
	return ((jfloat) jsNumber->Value());
}


v8::Handle<v8::Number> TypeConverter::javaFloatToJsNumber(jfloat javaFloat)
{
	return v8::Number::New ((double) javaFloat);
}


jdouble TypeConverter::jsNumberToJavaDouble(v8::Handle<v8::Number> jsNumber)
{
	return ((jdouble) jsNumber->Value());
}


v8::Handle<v8::Number> TypeConverter::javaDoubleToJsNumber(jdouble javaDouble)
{
	return v8::Number::New (javaDouble);
}


jboolean TypeConverter::jsBooleanToJavaBoolean(v8::Handle<v8::Boolean> jsBoolean)
{
	return (jsBoolean->Value()) == JNI_TRUE;
}


v8::Handle<v8::Boolean> TypeConverter::javaBooleanToJsBoolean(jboolean javaBoolean)
{
	return v8::Boolean::New ((bool) javaBoolean);
}


jstring TypeConverter::jsStringToJavaString (v8::Handle<v8::String> jsString)
{
	v8::String::Value javaString (jsString);
	return TypeConverter::env->NewString (*javaString, javaString.length());
}


v8::Handle<v8::String> TypeConverter::javaStringToJsString(jstring javaString)
{
	const char *nativeString = TypeConverter::env->GetStringUTFChars (javaString, 0);
	int nativeStringLength = TypeConverter::env->GetStringUTFLength (javaString);

	v8::Handle<v8::String> jsString = v8::String::New (nativeString, nativeStringLength);
	TypeConverter::env->ReleaseStringUTFChars (javaString, nativeString);

	return jsString;
}


jobject TypeConverter::jsValueToJavaObject (v8::Local<v8::Value> jsValue)
{
	jobject javaObject;

	if (value->IsNumber())
	{
		jdouble jsNumber = jsNumberToJavaDouble (jsValue->ToNumber());
		jclass javaDoubleClass = TypeConverter::getJavaClass ("java/lang/Double");
		jmethodID javaDoubleConstructor = TypeConverter::getJavaMethodId (javaDoubleClass, "<init>", "(D)V");
		javaObject = TypeConverter::env->NewObject (javaDoubleClass, javaDoubleConstructor, jsNumber);
	}
	else if (element->IsBoolean())
	{
		jboolean jsBoolean = jsBooleanToJavaBoolean (jsValue->ToBoolean());
		jclass javaBooleanClass = TypeConverter::getJavaClass ("java/lang/Boolean");
		jmethodID javaBooleanConstructor = TypeConverter::getJavaMethodId (javaBooleanClass, "<init>", "(Z)V");
		javaObject = TypeConverter::env->NewObject (javaBooleanClass, javaBooleanConstructor, jsBoolean);
	}
	else if (element->IsString())
	{
		jstring jsString = jsStringToJavaString (jsValue->ToString());
		jclass javaStringClass = TypeConverter::getJavaClass ("java/lang/String");
		jmethodID javaStringConstructor = TypeConverter::getJavaMethodId (javaStringClass, "<init>", "([C)V");
		javaObject = TypeConverter::env->NewObject (javaStringClass, javaStringConstructor, jsString);
	}
	else if (element->IsDate())
	{

	}
	else if (element->IsArray())
	{

	}
	else if (element->IsObject())
	{
		/*
		// check for proxy type here?
		if (is proxy)
		{

		}
		else // use the KrollV8Dict
		{

		}
		*/
	}
}


jarray TypeConverter::jsArrayToJavaArray (v8::Handle<v8::Array> jsArray)
{
	// store array length from v8
	int arrayLength = jsArray->Length();

	// get the class needed
	jclass javaObjectClass = TypeConverter::env->FindClass ("java/lang/object");
	if (javaObjectClass == NULL)
	{
		return NULL; // exception thrown
	}

	// create the jni array
	jobjectArray javaArray = TypeConverter::env->NewObjectArray (arrayLength, javaObjectClass, NULL);
	if (javaArray == NULL)
	{
		return NULL; // out of memory
	}

	for (int i = 0; i < arrayLength; i++)
	{
		v8::Local<v8::Value> element = jsArray->Get(i);
		jobject javaObject = jsValueToJavaObject (element);
		TypeConverter::env->SetObjectArrayElement (javaArray, i, javaObject);
/*
		if (element->IsNumber())
		{
			jdouble jsNumber = jsNumberToJavaDouble (element->ToNumber());

			// get class
			jclass javaDoubleClass = TypeConverter::env->FindClass ("java/lang/Double");
			if (javaDoubleClass == NULL)
			{
				return NULL; // exception thrown
			}

			// get constructor
			jmethodID javaDoubleConstructor = TypeConverter::env->GetMethodID (javaDoubleClass, "<init>", "(D)V");
			if (javaDoubleConstructor == NULL)
			{
				return NULL;
			}

			jobject javaDouble = TypeConverter::env->NewObject(javaDoubleClass, javaDoubleConstructor, jsNumber);
			TypeConverter::env->SetObjectArrayElement (javaArray, i, javaDouble);
			
		}
		else if (element->IsBoolean())
		{
		
		}
		else if (element->IsString())
		{
		
		}
		else if (element->IsDate())
		{
		
		}
		else if (element->IsArray())
		{
		
		}
		else if (element->IsObject())
		{
			/*
			// check for proxy type here?
			if (is proxy)
			{

			}
			else // use the KrollV8Dict
			{

			}
			*/
		}
*/
	}

	return javaArray;
}


//? TypeConverter::jsDateToJavaDate();
//jlong TypeConverter::jsDateToJavaLong();
//? TypeConverter::jsUndefinedToJavaUndefined();


