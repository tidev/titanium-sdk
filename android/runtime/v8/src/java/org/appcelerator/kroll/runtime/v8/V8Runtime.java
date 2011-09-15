package org.appcelerator.kroll.runtime.v8;

public class V8Runtime
{
	public static void init()
	{
		System.loadLibrary("kroll-v8");
		nativeInit();
	}

	public static void initModuleTemplate(Class<?> moduleClass)
	{
		nativeInitModuleTemplate(moduleClass);
	}

	private static native void nativeInit();
	private static native void nativeInitModuleTemplate(Class<?> moduleClass);
}
