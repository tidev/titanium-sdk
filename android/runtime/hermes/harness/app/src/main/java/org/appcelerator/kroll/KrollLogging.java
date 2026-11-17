package org.appcelerator.kroll;

import android.util.Log;

/** Harness stand-in. */
public class KrollLogging
{
	public static void logWithDefaultLogger(int severity, String message)
	{
		Log.i("HermesHarness", message);
	}
}
