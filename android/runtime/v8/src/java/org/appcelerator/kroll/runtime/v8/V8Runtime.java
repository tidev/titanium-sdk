package org.appcelerator.kroll.runtime.v8;

public class V8Runtime
{
	public static void init()
	{
		System.loadLibrary("kroll-v8");
		nativeInit();
	}

	private static native void nativeInit();
}
