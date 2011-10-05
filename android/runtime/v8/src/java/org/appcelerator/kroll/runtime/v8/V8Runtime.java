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

	private static final int MSG_INVOKE_CALLBACK = 1000;
	private static final int MSG_FIRE_EVENT = 1001;

	private static V8Runtime _instance;

	private long mainThreadId;

	private V8Runtime(Looper looper)
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

		Looper mainLooper = Looper.getMainLooper();
		mainThreadId = mainLooper.getThread().getId();
		nativeInit(useGlobalRefs);
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

	public boolean isUiThread()
	{
		return Thread.currentThread().getId() == mainThreadId;
	}

	public void dispose()
	{
		nativeDispose();
	}

	public void evalFile(String filename)
	{
		try {
			Log.d(TAG, "evalFile: " + filename);
			char[] chars = Assets.readResource(filename);
			if (chars != null && chars.length > 0) {
				nativeRunModule(new String(chars), filename);
			}
		} catch (IOException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	private native void nativeInit(boolean useGlobalRefs);
	private native void nativeRunModule(String source, String filename);
	private native void nativeDispose();
}
