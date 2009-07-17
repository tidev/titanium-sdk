package org.appcelerator.titanium.util;

public class Log {

	public static int v(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.v(tag, msg);
	}
	public static int v(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.v(tag, msg, t);
	}

	public static int d(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.d(tag, msg);
	}
	public static int d(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.d(tag, msg, t);
	}

	public static int i(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.i(tag, msg);
	}
	public static int i(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.i(tag, msg, t);
	}

	public static int w(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.w(tag, msg);
	}
	public static int w(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.w(tag, msg, t);
	}

	public static int e(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.e(tag, msg);
	}
	public static int e(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.e(tag, msg, t);
	}

	private static String onThread(String msg) {
		StringBuilder sb = new StringBuilder(256);
		sb.append("(").append(Thread.currentThread().getName()).append(") ").append(msg)
		;
		String s = sb.toString();
		sb.setLength(0);
		return s;
	}
}
