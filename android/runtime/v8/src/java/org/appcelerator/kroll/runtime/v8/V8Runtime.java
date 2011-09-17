package org.appcelerator.kroll.runtime.v8;

import java.io.IOException;

import org.appcelerator.kroll.runtime.Assets;

public final class V8Runtime
{
	private V8Runtime() { }
	
	public static void init()
	{
		System.loadLibrary("kroll-v8");
		init(new V8Runtime());
	}

	public static void evalFile(V8Object scope, String filename)
	{
		try {
			char[] bytes = Assets.getInstance().readResource(filename);
			evalData(scope, bytes, filename);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void evalString(V8Object scope, String source, String sourceName)
	{
		evalData(scope, source.toCharArray(), sourceName);
	}

	private static native void init(V8Runtime runtime);
	private static native void evalData(V8Object scope, char[] buffer, String filename);

	public static native void dispose();

	/*
	private static native void nativeInitModuleTemplate(Class<?> moduleClass);
	public static void initModuleTemplate(Class<?> moduleClass)
	{
		nativeInitModuleTemplate(moduleClass);
	}
	*/

}
