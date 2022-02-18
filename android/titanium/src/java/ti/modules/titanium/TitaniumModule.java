/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium;

import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import android.util.SparseArray;

@Kroll.module
@Kroll.topLevel({ "Ti", "Titanium" })
public class TitaniumModule extends KrollModule
{
	private static final String TAG = "TitaniumModule";

	private static final int MSG_ALERT = KrollProxy.MSG_LAST_ID + 100;

	private Stack<String> basePath;
	private final Map<String, NumberFormat> numberFormats = java.util.Collections.synchronizedMap(new HashMap<>());
	private static final SparseArray<Timer> activeTimers = new SparseArray<>();
	private static int lastTimerId = 1;

	public TitaniumModule()
	{
		basePath = new Stack<>();
	}

	@Override
	protected void initActivity(Activity activity)
	{
		super.initActivity(activity);
		basePath.push(getCreationUrl().baseUrl);
	}

	@Kroll.getProperty
	public String getUserAgent()
	{
		StringBuilder builder = new StringBuilder();
		String httpAgent = System.getProperty("http.agent");
		if (httpAgent != null) {
			builder.append(httpAgent);
		}
		builder.append(" Titanium/").append(getVersion());
		return builder.toString();
	}

	@Kroll.getProperty
	public String getVersion()
	{
		return TiApplication.getInstance().getTiBuildVersion();
	}

	@Kroll.getProperty
	public String getBuildTimestamp()
	{
		return TiApplication.getInstance().getTiBuildTimestamp();
	}

	@Kroll.getProperty
	public String getBuildDate()
	{
		return TiApplication.getInstance().getTiBuildTimestamp();
	}

	@Kroll.getProperty
	public String getBuildHash()
	{
		return TiApplication.getInstance().getTiBuildHash();
	}

	// For testing exception handling.  Can remove after ticket 2032
	@Kroll.method
	public void testThrow()
	{
		throw new Error("Testing throwing throwables");
	}

	private class Timer implements Runnable
	{
		protected long timeout;
		protected boolean interval;
		protected Object[] args;
		protected KrollFunction callback;
		protected Handler handler;
		protected int id;
		protected boolean canceled;

		public Timer(int id, Handler handler, KrollFunction callback, long timeout, Object[] args, boolean interval)
		{
			this.id = id;
			this.handler = handler;
			this.callback = callback;
			this.timeout = timeout;
			this.args = args;
			this.interval = interval;
		}

		public void schedule()
		{
			handler.postDelayed(this, timeout);
		}

		public void run()
		{
			if (canceled) {
				return;
			}

			if (Log.isDebugModeEnabled()) {
				StringBuilder message = new StringBuilder("calling ")
											.append(interval ? "interval" : "timeout")
											.append(" timer ")
											.append(id)
											.append(" @")
											.append(new Date().getTime());

				Log.d(TAG, message.toString());
			}

			long start = System.currentTimeMillis();
			callback.call(getKrollObject(), args);

			// If this timer is repeating schedule it for another round.
			// Otherwise remove the timer from the active list and quit.
			if (interval && !canceled) {
				handler.postDelayed(this, timeout - (System.currentTimeMillis() - start));

			} else {
				activeTimers.remove(id);
			}
		}

		public void cancel()
		{
			handler.removeCallbacks(this);
			canceled = true;
		}
	}

	private int createTimer(KrollFunction callback, Number timeout, Object[] args, boolean interval)
	{
		// Generate an unique identifier for this timer.
		// This will later be used by the developer to cancel a timer.
		final int timerId = lastTimerId++;

		if (timeout == null || timeout.longValue() < 1L) {
			timeout = 1L;
		}
		Timer timer = new Timer(timerId, getRuntimeHandler(), callback, timeout.longValue(), args, interval);
		activeTimers.append(timerId, timer);

		timer.schedule();

		return timerId;
	}

	private void cancelTimer(int timerId)
	{
		Timer timer = activeTimers.get(timerId);
		if (timer != null) {
			timer.cancel();
			activeTimers.remove(timerId);
		}
	}

	public static void cancelTimers()
	{
		final int timerCount = activeTimers.size();
		for (int i = 0; i < timerCount; i++) {
			Timer timer = activeTimers.valueAt(i);
			timer.cancel();
		}

		activeTimers.clear();
	}

	@Kroll.method
	@Kroll.topLevel
	public int setTimeout(KrollFunction krollFunction, Object[] args)
	{
		Number timeout = null;
		if (args != null && args.length > 0) {
			timeout = (Number) args[0];
			args = Arrays.copyOfRange(args, 1, args.length);
		}
		return createTimer(krollFunction, timeout, args, false);
	}

	@Kroll.method
	@Kroll.topLevel
	public int setInterval(KrollFunction krollFunction, Object[] args)
	{
		Number timeout = null;
		if (args != null && args.length > 0) {
			timeout = (Number) args[0];
			args = Arrays.copyOfRange(args, 1, args.length);
		}
		return createTimer(krollFunction, timeout, args, true);
	}

	@Kroll.method
	@Kroll.topLevel
	public void clearTimeout(int timerId)
	{
		cancelTimer(timerId);
	}

	@Kroll.method
	@Kroll.topLevel
	public void clearInterval(int timerId)
	{
		cancelTimer(timerId);
	}

	@Kroll.method
	@Kroll.topLevel
	public void alert(Object message)
	{
		String msg = (message == null ? null : message.toString());

		if (TiApplication.isUIThread()) {
			TiUIHelper.doOkDialog("", msg, null);
		} else {
			getMainHandler().obtainMessage(MSG_ALERT, msg).sendToTarget();
		}
	}

	@Kroll.method
	@Kroll.topLevel("String.format")
	public String stringFormat(String format, Object[] args)
	{
		try {

			// in case someone passes an iphone formatter symbol, convert
			format = format.replaceAll("%@", "%s");

			if (args.length == 0) {
				return String.format(format);

			} else {
				return String.format(format, args);
			}

		} catch (Exception ex) {
			Log.e(TAG, "Error occured while formatting string", ex);
			return null;
		}
	}

	@Kroll.method
	@Kroll.topLevel("String.formatDate")
	public String stringFormatDate(Object date, @Kroll.argument(optional = true) String format)
	{
		int style = DateFormat.SHORT;

		if (format != null) {
			if (format.equals("medium")) {
				style = DateFormat.MEDIUM;

			} else if (format.equals("long")) {
				style = DateFormat.LONG;
			} else if (format.equals("full")) {
				style = DateFormat.FULL;
			}
		}
		if (date instanceof Date) {
			return (DateFormat.getDateInstance(style)).format(date);
		} else {
			Log.e(TAG, "The string.formatDate() function was given an invalid argument. Must be of type 'Date'.");
			return null;
		}
	}

	@Kroll.method
	@Kroll.topLevel("String.formatTime")
	public String stringFormatTime(Object time)
	{
		int style = DateFormat.SHORT;

		if (time instanceof Date) {
			try {
				return (DateFormat.getTimeInstance(style)).format(time);
			} catch (Exception ex) {
				Log.e(TAG, "Error occurred while formatting time", ex);
				return null;
			}
		} else {
			Log.e(TAG, "The string.formatTime() function was given an invalid argument. Must be of type 'Date'.");
			return null;
		}
	}

	@Kroll.method
	@Kroll.topLevel("String.formatCurrency")
	public String stringFormatCurrency(double currency)
	{
		return NumberFormat.getCurrencyInstance().format(currency);
	}

	@Kroll.method
	@Kroll.topLevel("String.formatDecimal")
	public String stringFormatDecimal(Object[] args)
	{
		String pattern = null;
		String locale = null;

		if (args.length == 2) {
			// Is the second argument a locale string or a format string?
			String test = TiConvert.toString(args[1]);
			if (test != null && test.length() > 0) {
				if (test.contains(".") || test.contains("#") || test.contains("0")) {
					pattern = test;

				} else {
					locale = test;
				}
			}

		} else if (args.length >= 3) {
			// this is: stringFormatDecimal(n, locale_string, pattern_string);
			locale = TiConvert.toString(args[1]);
			pattern = TiConvert.toString(args[2]);
		}

		String key = (locale == null ? "" : locale) + " keysep " + (pattern == null ? "" : pattern);

		NumberFormat format;
		if (numberFormats.containsKey(key)) {
			format = numberFormats.get(key);

		} else {
			if (locale != null) {
				format = NumberFormat.getInstance(TiPlatformHelper.getInstance().getLocale(locale));

			} else {
				format = NumberFormat.getInstance();
			}

			if (pattern != null && format instanceof DecimalFormat) {
				((DecimalFormat) format).applyPattern(pattern);
			}

			numberFormats.put(key, format);
		}

		return format.format((Number) args[0]);
	}

	@Kroll.method
	public String localize(Object[] args)
	{
		String key = (String) args[0];
		String defaultValue = args.length > 1 ? (String) args[1] : null;

		try {
			int resid = TiRHelper.getResource("string." + key);
			if (resid != 0) {
				return TiApplication.getInstance().getString(resid);

			} else {
				return defaultValue;
			}

		} catch (TiRHelper.ResourceNotFoundException e) {
			if (Log.isDebugModeEnabled()) {
				Log.d(TAG, "Resource string with key '" + key + "' not found.  Returning default value.",
					  Log.DEBUG_MODE);
			}

			return defaultValue;

		} catch (Exception e) {
			Log.e(TAG, "Exception trying to localize string '" + key + "': ", e);

			return defaultValue;
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ALERT: {
				TiUIHelper.doOkDialog("Alert", (String) msg.obj, null);

				return true;
			}
		}

		return super.handleMessage(msg);
	}

	@Override
	public String getApiName()
	{
		return "Ti";
	}
}
