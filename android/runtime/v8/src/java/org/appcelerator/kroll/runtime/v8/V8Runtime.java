package org.appcelerator.kroll.runtime.v8;

import java.io.IOException;

import org.appcelerator.kroll.runtime.Assets;

import android.util.Log;

public final class V8Runtime
{
	private static final String TAG = "V8Runtime";
	private static final String DEVICE_LIB = "kroll-v8-device";
	private static final String EMULATOR_LIB = "kroll-v8-emulator";

	private static final String DEFAULT_LIB = DEVICE_LIB;

	private static V8Context globalContext;

	private V8Runtime() { }

	public static V8Context init()
	{
		if (globalContext == null) {
			System.loadLibrary(DEFAULT_LIB);
			long contextPtr = nativeInit(new V8Runtime());
			globalContext = new V8Context(contextPtr);
		}
		return globalContext;
	}

	public static void dispose()
	{
		globalContext.release();
		nativeDispose();
	}

	public static void evalFile(V8Object scope, String filename)
	{
		try {
			Log.d(TAG, "evalFile: " + filename);
			char[] chars = Assets.readResource(filename);
			if (chars != null && chars.length > 0) {
				V8Script.runInContextNoResult(new String(chars), globalContext, filename);
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private static native long nativeInit(V8Runtime runtime);
	private static native void nativeDispose();

	/*
	private static native void nativeInitModuleTemplate(Class<?> moduleClass);
	public static void initModuleTemplate(Class<?> moduleClass)
	{
		nativeInitModuleTemplate(moduleClass);
	}
	*/

}
