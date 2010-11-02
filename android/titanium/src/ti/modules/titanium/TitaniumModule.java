/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium;

import java.io.IOException;
import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;
import java.util.Timer;
import java.util.TimerTask;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollModuleInfo;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiResourceHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;

@Kroll.module @Kroll.topLevel({"Ti", "Titanium"})
public class TitaniumModule extends KrollModule implements TiContext.OnLifecycleEvent
{
	private static final String LCAT = "TitaniumModule";
	private Stack<String> basePath;
	private Map<String, NumberFormat> numberFormats = java.util.Collections.synchronizedMap(
			new HashMap<String, NumberFormat>());

	public TitaniumModule(TiContext tiContext) {
		super(tiContext);
		basePath = new Stack<String>();
		basePath.push(tiContext.getBaseUrl());
		
		tiContext.addOnLifecycleEventListener(this);
	}
	
	@Kroll.getProperty @Kroll.method
	public String getUserAgent() {
		return System.getProperties().getProperty("http.agent")+" Titanium/"+getVersion();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getVersion() {
		return getTiContext().getTiApp().getTiBuildVersion();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getBuildTimestamp() {
		return getTiContext().getTiApp().getTiBuildTimestamp();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getBuildDate() {
		return getTiContext().getTiApp().getTiBuildTimestamp();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getBuildHash() {
		return getTiContext().getTiApp().getTiBuildHash();
	}
	
	// For testing exception handling.  Can remove after ticket 2032
	@Kroll.method
	public void testThrow(){ throw new Error("Testing throwing throwables"); }

	@Kroll.method
	public void include(KrollInvocation invocation, Object[] files) {
		TiContext tiContext = invocation.getTiContext();
		for(Object filename : files) {
			try {
				// we need to make sure paths included from sub-js files are actually relative
				boolean popContext = false;
				if (!basePath.contains(tiContext.getBaseUrl())) {
					basePath.push(tiContext.getBaseUrl());
					popContext = true;
				}
				String resolved = tiContext.resolveUrl(null, TiConvert.toString(filename), basePath.peek());
				basePath.push(resolved.substring(0, resolved.lastIndexOf('/')+1));
				tiContext.evalFile(resolved);
				basePath.pop();
				
				if (popContext) {
					basePath.pop();
				}
			} catch (IOException e) {
				Log.e(LCAT, "Error while evaluating: " + filename, e);
			}
		}
	}

	private HashMap<Integer, Timer> timers = new HashMap<Integer, Timer>();
	private int currentTimerId;

	private int createTimer(Object fn, long timeout, final Object[] args, final boolean interval)
		throws IllegalArgumentException
	{
		// TODO: we should handle evaluatable code eventually too..
		if (fn instanceof KrollCallback) {
			final KrollCallback callback = (KrollCallback) fn;
			Timer timer = new Timer();
			final int timerId = currentTimerId++;

			timers.put(timerId, timer);
			TimerTask task = new TimerTask() {
				@Override
				public void run() {
					Log.d(LCAT, "calling " + (interval?"interval":"timeout") + " timer " + timerId + " @" + new Date().getTime());
					callback.call(args);
				}
			};

			if (interval) {
				timer.schedule(task, timeout, timeout);
			} else {
				timer.schedule(task, timeout);
			}

			return timerId;
		}
		else throw new IllegalArgumentException("Don't know how to call callback of type: " + fn.getClass().getName());
	}

	@Kroll.method @Kroll.topLevel
	public int setTimeout(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(fn, timeout, args, false);
	}

	@Kroll.method @Kroll.topLevel
	public void clearTimeout(int timerId) {
		if (timers.containsKey(timerId)) {
			Timer timer = timers.remove(timerId);
			timer.cancel();
		}
	}

	@Kroll.method @Kroll.topLevel
	public int setInterval(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(fn, timeout, args, true);
	}

	@Kroll.method @Kroll.topLevel
	public void clearInterval(int timerId) {
		clearTimeout(timerId);
	}

	@Kroll.method @Kroll.topLevel
	public void alert(Object message) {
		String msg = (message == null? null : message.toString());
		Log.i("ALERT", msg);
		Activity currentActivity = getTiContext().getTiApp().getCurrentActivity();
		if (currentActivity == null) {
		  currentActivity = getTiContext().getActivity();
		}
		TiUIHelper.doOkDialog(currentActivity, "Alert", msg, null);
	}
	
	public void cancelTimers() {
		for (Timer timer: timers.values()) {
			if (timer != null) {
				timer.cancel();
			}
		}
		timers.clear();
	}
	
	@Kroll.method @Kroll.topLevel("String.format")
	public String stringFormat(String format, Object args[])
	{
		try {
			// clean up formats for integers into doubles since thats how JS rolls
			format = format.replaceAll("%d", "%1.0f");
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
		if (format.equals("medium")) {
			style = DateFormat.MEDIUM;
		} else if (format.equals("long")) {
			style = DateFormat.LONG;
		}
		
		DateFormat fmt = DateFormat.getDateInstance(style);
		return fmt.format(date);
	}

	@Kroll.method @Kroll.topLevel("String.formatTime")
	public String stringFormatTime(Date time)
	{
		int style = DateFormat.SHORT;
		DateFormat fmt = DateFormat.getTimeInstance(style);
		return fmt.format(time);
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
	public String localize(KrollInvocation invocation, Object args[])
	{
		String key = (String) args[0];
		int value = TiResourceHelper.getString(key);
		if (value == 0) {
			if (args.length > 1) {
				return (String) args[1];
			}
			return null;
		}
		return invocation.getTiContext().getActivity().getString(value);
	}
	
	protected KrollModule requireNativeModule(TiContext context, String path) {
		Log.d(LCAT, "Attempting to include native module: " + path);
		KrollModuleInfo info = KrollModule.getModuleInfo(path);
		if (info == null) return null;
		
		return context.getTiApp().requireModule(context, info);
	}
	
	@Kroll.method @Kroll.topLevel
	public KrollProxy require(KrollInvocation invocation, String path) {
		
		// 1. look for a TiPlus module first
		// 2. then look for a cached module
		// 3. then attempt to load from resources
		TiContext ctx = invocation.getTiContext();
		
		KrollModule module = requireNativeModule(ctx, path);
		if (module != null) {
			KrollModuleInfo info = module.getModuleInfo();
			Log.d(LCAT, "Succesfully loaded module: " + info.getName() + "/" + info.getVersion());
			return module;
		}
		
		// NOTE: commonjs modules load absolute to root in Titanium
		String fileUrl = "app://"+path+".js";
		TiBaseFile tbf = TiFileFactory.createTitaniumFile(ctx, new String[]{ fileUrl }, false);
		if (tbf!=null)
		{
			try
			{
				TiBlob blob = (TiBlob)tbf.read();
				if (blob == null) {
					Log.e(LCAT, "Couldn't read required file: " + fileUrl);
					return null;
				}
				
				// create the common js exporter
				KrollProxy proxy = new KrollProxy(ctx);
				StringBuilder buf = new StringBuilder();
				buf.append("(function(exports){");
				buf.append(blob.getText());
				buf.append("return exports;");
				buf.append("})({})");
				Scriptable result = (Scriptable)ctx.evalJS(buf.toString());
				// common js modules export all functions/properties as 
				// properties of the special export object provided
				for (Object key : result.getIds())
				{
					String propName = key.toString();
					Scriptable propValue = (Scriptable)result.get(propName,result);
					proxy.setProperty(propName, propValue);
				}
				// spec says you must have a read-only id property - we don't
				// currently support readonly in kroll so this is probably OK for now
				proxy.setProperty("id", path);
				// uri is optional but we point it to where we loaded it
				proxy.setProperty("uri",fileUrl);
				return proxy;
			}
			catch(Exception ex)
			{
				Log.e(LCAT,"Error loading module named: "+path,ex);
				Context.throwAsScriptRuntimeEx(ex);
				return null;
			}
		}
		
		//the spec says we are required to through an exception
		Context.reportError("couldn't find module: "+path);
		return null;
	}
	
	@Override
	public void onDestroy() {
		cancelTimers();
	}
	
	@Override
	public void onStop() {
		cancelTimers();
	}
	
	@Override
	public void onStart() {
	}
	
	@Override
	public void onPause() {	
	}
	
	@Override
	public void onResume() {
	}
}