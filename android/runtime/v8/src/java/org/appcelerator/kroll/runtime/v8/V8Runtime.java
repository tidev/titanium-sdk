package org.appcelerator.kroll.runtime.v8;

import java.io.IOException;

import org.appcelerator.kroll.runtime.Assets;

import android.os.Build;
import android.os.Looper;
import android.util.Log;

public final class V8Runtime
{
	private static final String TAG = "V8Runtime";
	private static final String DEVICE_LIB = "kroll-v8-device";
	private static final String EMULATOR_LIB = "kroll-v8-emulator";

	private static V8Runtime _instance;

	private V8Context globalContext;
	private Looper v8Looper;
	private long v8LooperThreadId;

	private V8Runtime(Looper v8Looper)
	{
		boolean useGlobalRefs = true;
		String libName = DEVICE_LIB;
		if (Build.PRODUCT.equals("sdk") || Build.PRODUCT.equals("google_sdk")) {
			Log.i(TAG, "Loading emulator version of kroll-v8");
			libName = EMULATOR_LIB;
			useGlobalRefs = false;
		}

		System.loadLibrary(libName);
		_instance = this;
		this.v8Looper = v8Looper;
		v8LooperThreadId = v8Looper.getThread().getId();

		globalContext = new V8Context(nativeInit(useGlobalRefs));
	}

	public static void init(Looper v8Looper)
	{
		if (_instance == null) {
			new V8Runtime(v8Looper);
		}
	}

	public static V8Runtime getInstance()
	{
		return _instance;
	}

	public V8Context getGlobalContext()
	{
		return globalContext;
	}

	public Looper getV8Looper()
	{
		return v8Looper;
	}

	public Thread getV8Thread()
	{
		return v8Looper.getThread();
	}

	public boolean isV8Thread()
	{
		return Thread.currentThread().getId() == v8LooperThreadId;
	}

	public void dispose()
	{
		globalContext.release();
		nativeDispose();
	}

	public void evalFile(String filename)
	{
		try {
			Log.d(TAG, "evalFile: " + filename);
			char[] chars = Assets.readResource(filename);
			if (chars != null && chars.length > 0) {
				V8Script.runInThisContextNoResult(new String(chars), filename);
			}
		} catch (IOException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	private native long nativeInit(boolean useGlobalRefs);
	private native void nativeDispose();
}
