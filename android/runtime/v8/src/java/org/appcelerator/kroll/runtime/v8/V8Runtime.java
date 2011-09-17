package org.appcelerator.kroll.runtime.v8;

public final class V8Runtime
{

	private V8Runtime() {
	}

	public static void init()
	{
		System.loadLibrary("kroll-v8");
		init(new V8Runtime());
	}

	private static native void init(V8Runtime runtime);
	public static native void dispose();

	/*
	private static native void nativeInitModuleTemplate(Class<?> moduleClass);
	public static void initModuleTemplate(Class<?> moduleClass)
	{
		nativeInitModuleTemplate(moduleClass);
	}
	*/

}
