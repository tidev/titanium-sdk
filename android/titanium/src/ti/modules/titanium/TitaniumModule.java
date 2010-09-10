/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Stack;
import java.util.Timer;
import java.util.TimerTask;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;

@Kroll.module @Kroll.topLevel({"Ti", "Titanium"})
public class TitaniumModule extends KrollModule implements TiContext.OnLifecycleEvent
{
	private static final String LCAT = "TitaniumModule";
	private Stack<String> basePath;

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
	
	@Kroll.method @Kroll.topLevel
	public KrollProxy require(String path) {
		
		// 1. look for a TiPlus module first
		// 2. then look for a cached module
		// 3. then attempt to load from resources
		TiContext ctx = getTiContext();
		KrollProxy proxy = new KrollProxy(ctx);
		
		//TODO: right now, we're only supporting app 
		//level modules until TiPlus is done for android
		
		// NOTE: commonjs modules load absolute to root in Titanium
		String fileUrl = "app://"+path+".js";
		TiBaseFile tbf = TiFileFactory.createTitaniumFile(ctx, new String[]{ fileUrl }, false);
		if (tbf!=null)
		{
			try
			{
				TiBlob blob = (TiBlob)tbf.read();
				if (blob!=null)
				{
					// create the common js exporter
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