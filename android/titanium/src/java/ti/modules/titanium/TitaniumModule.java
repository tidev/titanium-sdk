/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Stack;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.os.Environment;
import android.os.Handler;

@Kroll.module @Kroll.topLevel({"Ti", "Titanium"})
public class TitaniumModule extends KrollModule
{
	private static final String LCAT = "TitaniumModule";
	private static final boolean DBG = TiConfig.LOGD;

	private Stack<String> basePath;
	private Map<String, NumberFormat> numberFormats = java.util.Collections.synchronizedMap(
		new HashMap<String, NumberFormat>());

	public TitaniumModule()
	{
		basePath = new Stack<String>();
		/* TODO if (tiContext.isServiceContext()) {
			tiContext.addOnServiceLifecycleEventListener(this);
		} else {
			tiContext.addOnLifecycleEventListener(this);
		}*/
	}

	@Override
	protected void initActivity(Activity activity)
	{
		super.initActivity(activity);
		basePath.push(getCreationUrl().baseUrl);
	}

	@Kroll.getProperty @Kroll.method
	public String getUserAgent()
	{
		StringBuilder builder = new StringBuilder();
		String httpAgent = System.getProperty("http.agent");
		if (httpAgent != null) {
			builder.append(httpAgent);
		}
		builder.append(" Titanium/")
			.append(getVersion());
		return builder.toString();
	}

	@Kroll.getProperty @Kroll.method
	public String getVersion()
	{
		return TiApplication.getInstance().getTiBuildVersion();
	}

	@Kroll.getProperty @Kroll.method
	public String getBuildTimestamp()
	{
		return TiApplication.getInstance().getTiBuildTimestamp();
	}

	@Kroll.getProperty @Kroll.method
	public String getBuildDate()
	{
		return TiApplication.getInstance().getTiBuildTimestamp();
	}

	@Kroll.getProperty @Kroll.method
	public String getBuildHash()
	{
		return TiApplication.getInstance().getTiBuildHash();
	}

	// For testing exception handling.  Can remove after ticket 2032
	@Kroll.method
	public void testThrow(){ throw new Error("Testing throwing throwables"); }

	private static HashMap<Thread, HashMap<Integer, Timer>> timers = new HashMap<Thread, HashMap<Integer, Timer>>();
	private int currentTimerId;

	protected class Timer implements Runnable
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

			if (DBG) {
				StringBuilder message = new StringBuilder("calling ")
					.append(interval ? "interval" : "timeout")
					.append(" timer ")
					.append(id)
					.append(" @")
					.append(new Date().getTime());

				Log.d(LCAT, message.toString());
			}

			long start = System.currentTimeMillis();
			callback.call(getKrollObject(), args);
			if (interval && !canceled) {
				handler.postDelayed(this, timeout - (System.currentTimeMillis() - start));
			}
		}

		public void cancel()
		{
			handler.removeCallbacks(this);
			canceled = true;
		}
	}

	private int createTimer(KrollFunction callback, long timeout, Object[] args, boolean interval)
		throws IllegalArgumentException
	{
		int timerId = currentTimerId++;
		Handler handler = getRuntimeHandler();

		Timer timer = new Timer(timerId, handler, callback, timeout, args, interval);
		Thread thread = handler.getLooper().getThread();
		HashMap<Integer, Timer> threadTimers = timers.get(thread);
		if (threadTimers == null) {
			threadTimers = new HashMap<Integer, Timer>();
			timers.put(thread, threadTimers);
		}
		threadTimers.put(timerId, timer);
		timer.schedule();

		return timerId;
	}

	@Kroll.method @Kroll.topLevel
	public int setTimeout(KrollFunction krollFunction, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(krollFunction, timeout, args, false);
	}

	@Kroll.method @Kroll.topLevel
	public void clearTimeout(int timerId)
	{
		for (Thread thread : timers.keySet()) {
			HashMap<Integer, Timer> threadTimers = timers.get(thread);
			if (threadTimers.containsKey(timerId)) {
				Timer timer = threadTimers.remove(timerId);
				timer.cancel();

				break;
			}
		}
	}

	@Kroll.method @Kroll.topLevel
	public int setInterval(KrollFunction krollFunction, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(krollFunction, timeout, args, true);
	}

	@Kroll.method @Kroll.topLevel
	public void clearInterval(int timerId)
	{
		clearTimeout(timerId);
	}

	@Kroll.method @Kroll.topLevel
	public void alert(Object message)
	{
		String msg = (message == null? null : message.toString());
		Log.i("ALERT", msg);

		/* TODO - look at this along with the other service stuff
		if (invocation.getTiContext().isServiceContext()) {
			Log.w(LCAT, "alert() called inside service -- no attempt will be made to display it to user interface.");
			return;
		}
		*/

		TiUIHelper.doOkDialog("Alert", msg, null);
	}

	public static void cancelTimers(Thread thread)
	{
		HashMap<Integer, Timer> threadTimers = timers.get(thread);
		if (threadTimers == null) {
			return;
		}

		Iterator<Timer> timerIter = threadTimers.values().iterator();
		while (timerIter.hasNext()) {
			Timer timer = timerIter.next();
			if (timer != null) {
				timer.cancel();
				timerIter.remove();
			}
		}

		threadTimers.clear();
	}

	@Kroll.method @Kroll.topLevel("String.format")
	public String stringFormat(String format, Object args[])
	{
		try {
			// Rhino will always convert Number values to doubles.
			// To prevent conversion errors we will change all decimal
			// format arguments to floating point.
			if (KrollRuntime.getInstance().getRuntimeName().equals("rhino")) {
				format = format.replaceAll("%d", "%1.0f");
			}

			// in case someone passes an iphone formatter symbol, convert
			format = format.replaceAll("%@", "%s");

			if (args.length == 0) {
				return String.format(format);

			} else {
				return String.format(format, args);
			}

		} catch (Exception ex) {
			Log.e(LCAT, "Error in string format", ex);

			return null;
		}
	}

	@Kroll.method @Kroll.topLevel("String.formatDate")
	public String stringFormatDate(Date date, @Kroll.argument(optional=true) String format)
	{
		int style = DateFormat.SHORT;

		if (format != null) {
			if (format.equals("medium")) {
				style = DateFormat.MEDIUM;

			} else if (format.equals("long")) {
				style = DateFormat.LONG;
			}
		}

		return (DateFormat.getDateInstance(style)).format(date);
	}

	@Kroll.method @Kroll.topLevel("String.formatTime")
	public String stringFormatTime(Date time)
	{
		int style = DateFormat.SHORT;

		return (DateFormat.getTimeInstance(style)).format(time);
	}

	@Kroll.method @Kroll.topLevel("String.formatCurrency")
	public String stringFormatCurrency(double currency)
	{
		return NumberFormat.getCurrencyInstance().format(currency);
	}

	@Kroll.method @Kroll.topLevel("String.formatDecimal")
	public String stringFormatDecimal(Object args[])
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

		String key = (locale == null ? "" : locale ) + " keysep " + (pattern == null ? "": pattern);
		
		NumberFormat format;
		if (numberFormats.containsKey(key)) {
			format = numberFormats.get(key);

		} else {
			if (locale != null) {
				format = NumberFormat.getInstance(TiPlatformHelper.getLocale(locale));

			} else {
				format = NumberFormat.getInstance();
			}
		
			if (pattern != null && format instanceof DecimalFormat) {
				((DecimalFormat)format).applyPattern(pattern);
			}

			numberFormats.put(key, format);
		}

		return format.format((Number)args[0]);
	}

	@Kroll.method @Kroll.topLevel("L")
	public String localize(Object args[])
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
			if (DBG) {
				Log.d(LCAT, "Resource string with key '" + key + "' not found.  Returning default value.");
			}

			return defaultValue;

		} catch (Exception e) {
			Log.e(LCAT, "Exception trying to localize string '" + key + "': ", e);

			return defaultValue;
		}
	}

	@Kroll.method
	public void dumpCoverage()
	{
		TiApplication app = TiApplication.getInstance();
		if (app == null || !app.isCoverageEnabled()) {
			Log.w(LCAT, "Coverage is not enabled, no coverage data will be generated");

			return;
		}

		try {
			File extStorage = Environment.getExternalStorageDirectory();
			File reportFile = new File(new File(extStorage, app.getPackageName()), "coverage.json");
			FileOutputStream reportOut = new FileOutputStream(reportFile);
			// TODO KrollCoverage.writeCoverageReport(reportOut);
			reportOut.close();

		} catch (IOException e) {
			Log.e(LCAT, e.getMessage(), e);
		}
	}
}

