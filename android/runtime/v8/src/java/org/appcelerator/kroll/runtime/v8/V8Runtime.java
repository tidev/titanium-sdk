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
			char[] chars = Assets.instance.readResource(filename);
			if (chars != null && chars.length > 0) {
				V8Script.runInContext(new String(chars), scope, filename);				
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	/**
	 * @deprecated use org.appcelerator.kroll.runtime.v8.V8Script.runInContext(String, V8Object, String)
	 */
	public static V8Object evalString(V8Object scope, String source, String sourceName)
	{
		return V8Script.runInContext(source, scope, sourceName);
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
