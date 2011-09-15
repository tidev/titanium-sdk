#include <jni.h>

#include <TypeConverter.h>

using namespace titanium;

// declare static members
JNIEnv *TypeConverter::env;

// declare utility methods we dont want exposed via the header
jclass getJavaClass (char *className);
jmethodID getJavaMethodId (jclass javaClass, char *methodName, char *methodSignature);
jobject jsValueToJavaObject (v8::Local<v8::Value> jsValue);
v8::Handle<v8::Array> javaDoubleArrayToJsNumberArray (jdoubleArray javaDoubleArray);

void TypeConverter::initEnv(JNIEnv *env)
{
	TypeConverter::env = env;
}


jclass getJavaClass (const char *className)
{
	jclass javaClass = TypeConverter::env->FindClass (className);
	if (javaClass == NULL)
	{
		return NULL; // exception thrown
	}

	return javaClass;
}


jmethodID getJavaMethodId (jclass javaClass, const char *methodName, const char *methodSignature)
{
	jmethodID javaMethodId = TypeConverter::env->GetMethodID (javaClass, methodName, methodSignature);
	if (javaMethodId == NULL)
	{
		return NULL;
	}

	return javaMethodId;
}


jobject TypeConverter::jsValueToJavaObject (v8::Local<v8::Value> jsValue)
{
	if (jsValue->IsNumber())
	{
		jdouble javaDouble = TypeConverter::jsNumberToJavaDouble (jsValue->ToNumber());
		jclass javaDoubleClass = getJavaClass ("java/lang/Double");
		jmethodID javaDoubleConstructor = getJavaMethodId (javaDoubleClass, "<init>", "(D)V");
		return TypeConverter::env->NewObject (javaDoubleClass, javaDoubleConstructor, javaDouble);
	}
	else if (jsValue->IsBoolean())
	{
		jboolean javaBoolean = TypeConverter::jsBooleanToJavaBoolean (jsValue->ToBoolean());
		jclass javaBooleanClass = getJavaClass ("java/lang/Boolean");
		jmethodID javaBooleanConstructor = getJavaMethodId (javaBooleanClass, "<init>", "(Z)V");
		return TypeConverter::env->NewObject (javaBooleanClass, javaBooleanConstructor, javaBoolean);
	}
	else if (jsValue->IsString())
	{
		return TypeConverter::jsStringToJavaString (jsValue->ToString());
	}
	else if (jsValue->IsDate())
	{
		jlong javaLong = TypeConverter::jsDateToJavaLong (v8::Handle<v8::Date>::Cast (jsValue));
		jclass javaLongClass = getJavaClass ("java/lang/Long");
		jmethodID javaLongConstructor = getJavaMethodId (javaLongClass, "<init>", "(J)V");
		return TypeConverter::env->NewObject (javaLongClass, javaLongConstructor, javaLong);
	}
	else if (jsValue->IsArray())
	{
		return TypeConverter::jsArrayToJavaArray (v8::Handle<v8::Array>::Cast (jsValue));
	}
	else if (jsValue->IsObject())
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


v8::Handle<v8::Array> javaDoubleArrayToJsNumberArray (jdoubleArray javaDoubleArray)
{
	int arrayLength = TypeConverter::env->GetArrayLength (javaDoubleArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New (arrayLength);

	jdouble *arrayElements = TypeConverter::env->GetDoubleArrayElements (javaDoubleArray, 0);
	for (int i = 0; i < arrayLength; i++)
	{
		jsArray->Set ((uint32_t)i, v8::Number::New (arrayElements [i]));
	}

	return jsArray;
}


v8::Handle<v8::Object> javaObjectToJsObject (jobject javaObject)
{
	
	jclass hashMapClass;
	jclass proxyClass;
	jclass javaObjectClass = TypeConverter::env->GetObjectClass (javaObject);

	hashMapClass = getJavaClass ("java/util/HashMap");
	if (TypeConverter::env->IsInstanceOf (javaObjectClass, hashMapClass))
	{
/*
		// get the set off the HasMap
		jmethodID hashMapGet = TypeConverter::env->GetMethodID (hashMapClass, "get", "(Ljava/lang/Object;)Ljava/lang/Object;");
		jmethodID hashMapKeySet = TypeConverter::env->GetMethodID (hashMapClass, "keySet", "()Ljava/util/Set;");
		jobject hashMapSet = TypeConverter::env->CallObjectMethod (javaObject, hashMapKeySet);

		// key the array of keys off the HashMap set
		jclass setClass = getJavaClass ("java/util/Set");
		jmethodID setToArray = TypeConverter::env->GetMethodID (setClass, "toArray", "()[Ljava/lang/Object;");
		jobjectArray keys = TypeConverter::env->CallObjectMethod (hashMapSet, setToArray);
		int keysLength = TypeConverter::env->GetArrayLength (keys);

		for (int i = 0; i < keysLength; i++)
		{
			
		}
*/
	}

	proxyClass = getJavaClass ("org/appcelerator/kroll/KrollProxy");
	if (TypeConverter::env->IsInstanceOf (javaObjectClass, proxyClass))
	{
		v8::Handle<v8::Object> jsObject = v8::Object::New();

		
	}
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


jarray TypeConverter::jsArrayToJavaArray (v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jclass javaObjectClass = getJavaClass ("java/lang/object");
	jobjectArray javaArray = TypeConverter::env->NewObjectArray (arrayLength, javaObjectClass, NULL);

	for (int i = 0; i < arrayLength; i++)
	{
		v8::Local<v8::Value> element = jsArray->Get (i);
		jobject javaObject = jsValueToJavaObject (element);
		TypeConverter::env->SetObjectArrayElement (javaArray, i, javaObject);
	}

	return javaArray;
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jbooleanArray javaBooleanArray)
{
	int arrayLength = TypeConverter::env->GetArrayLength (javaBooleanArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New (arrayLength);

	jboolean *arrayElements = TypeConverter::env->GetBooleanArrayElements (javaBooleanArray, 0);
	for (int i = 0; i < arrayLength; i++)
	{
		jsArray->Set ((uint32_t)i, v8::Boolean::New (arrayElements [i]));
	}

	return jsArray;
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jshortArray javaShortArray)
{
	return javaDoubleArrayToJsNumberArray ((jdoubleArray) javaShortArray);
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jintArray javaIntArray)
{
	return javaDoubleArrayToJsNumberArray ((jdoubleArray)javaIntArray);
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jlongArray javaLongArray)
{
	return javaDoubleArrayToJsNumberArray ((jdoubleArray) javaLongArray);
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jfloatArray javaFloatArray)
{
	return javaDoubleArrayToJsNumberArray ((jdoubleArray) javaFloatArray);
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jdoubleArray javaDoubleArray)
{
	return javaDoubleArrayToJsNumberArray ((jdoubleArray) javaDoubleArray);
}


v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray (jobjectArray javaObjectArray)
{
	int arrayLength = TypeConverter::env->GetArrayLength (javaObjectArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New (arrayLength);

	for (int i = 0; i < arrayLength; i++)
	{
		javaObjectToJsObject (TypeConverter::env->GetObjectArrayElement (javaObjectArray, i));

		// will insert Handle<Object>
		//jsArray->Set ((uint32_t)i, v8::Value::New (TypeConverter::env->GetObjectArrayElement (javaObjectArray, i)));
	}

	return jsArray;
}


jobject TypeConverter::jsDateToJavaDate(v8::Handle<v8::Date> jsDate)
{
	jclass javaDateClass = getJavaClass ("java/util/Date");
	jmethodID javaDateConstructor = getJavaMethodId (javaDateClass, "<init>", "(J)V");
	return TypeConverter::env->NewObject (javaDateClass, javaDateConstructor, (jlong)jsDate->NumberValue());
}


jlong TypeConverter::jsDateToJavaLong(v8::Handle<v8::Date> jsDate)
{
	(jlong) jsDate->NumberValue();
}



v8::Handle<v8::Date> TypeConverter::javaDateToJsDate (jobject javaDate)
{
	jclass javaDateClass = TypeConverter::env->GetObjectClass (javaDate);
	jmethodID javaDateGetTimeMethod = getJavaMethodId (javaDateClass, "getTime", "()J");
	jlong epochTime = TypeConverter::env->CallLongMethod (javaDate, javaDateGetTimeMethod);
	return v8::Handle<v8::Date>::Cast (v8::Date::New ((double) epochTime));
}


v8::Handle<v8::Date> TypeConverter::javaLongToJsDate (jlong javaLong)
{
	return v8::Handle<v8::Date>::Cast (v8::Date::New ((double) javaLong));
}


jobject TypeConverter::getJavaUndefined()
{
	
}

