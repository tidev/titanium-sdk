package org.appcelerator.kroll;

import android.util.Log;

/** Harness stand-in. Has only the members that the native runtime looks up. */
public class KrollRuntime
{
	public static final int DONT_INTERCEPT = Integer.MIN_VALUE + 1;
	public static final Object UNDEFINED = new Object() {
		@Override
		public String toString()
		{
			return "undefined";
		}
	};
	public static String lastException;

	public static void dispatchException(String title, String message, String sourceName, int line,
		String lineSource, int lineOffset, String jsStack, String javaStack)
	{
		lastException = message + " @ " + sourceName + ":" + line + ":" + lineOffset;
		Log.e("HermesHarness", "dispatchException: " + lastException + "\n" + jsStack);
	}
}
