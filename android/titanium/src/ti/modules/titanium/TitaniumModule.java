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

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;

public class TitaniumModule
	extends TiModule
{
	private static final String LCAT = "TitaniumModule";
	private static TiDict constants;
	private Stack<String> basePath;
	private HashMap<String,TiProxy> modules;

	public TitaniumModule(TiContext tiContext) {
		super(tiContext);
		basePath = new Stack<String>();
		basePath.push(tiContext.getBaseUrl());
		
		tiContext.addOnLifecycleEventListener(this);
	}
	
	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			String version = getTiContext().getTiApp().getTiBuildVersion();
			constants.put("userAgent",System.getProperties().getProperty("http.agent")+" Titanium/"+version);
			constants.put("version", version);
			constants.put("buildTimestamp", getTiContext().getTiApp().getTiBuildTimestamp());
		}

		return constants;
	}

	public void include(TiContext tiContext, Object[] files) {
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

	public int setTimeout(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(fn, timeout, args, false);
	}

	public void clearTimeout(int timerId) {
		if (timers.containsKey(timerId)) {
			Timer timer = timers.remove(timerId);
			timer.cancel();
		}
	}

	public int setInterval(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		return createTimer(fn, timeout, args, true);
	}

	public void clearInterval(int timerId) {
		clearTimeout(timerId);
	}

	public void alert(Object message) {
		String msg = (message == null? null : message.toString());
		Log.i("ALERT", msg);
		Activity currentActivity = getTiContext().getTiApp().getCurrentActivity();
		if (currentActivity == null) {
		  currentActivity = getTiContext().getActivity();
		}
		TiUIHelper.doOkDialog(currentActivity, "Alert", msg, null);
	}
	
	public TiProxy require(String path) {
		
		// 1. look for a TiPlus module first
		// 2. then look for a cached module
		// 3. then attempt to load from resources
		TiContext ctx = getTiContext();
		TiProxy proxy = new TiProxy(ctx);
		
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
						proxy.setDynamicValue(propName,propValue);
					}
					// spec says you must have a read-only id property - we don't
					// currently support readonly in kroll so this is probably OK for now
					proxy.setDynamicValue("id",path);
					// uri is optional but we point it to where we loaded it
					proxy.setDynamicValue("uri",fileUrl);
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
		super.onDestroy();
	}
	
	@Override
	public void onStop() {
		cancelTimers();
		super.onStop();
	}
	
	public void cancelTimers() {
		for (Timer timer: timers.values()) {
			if (timer != null) {
				timer.cancel();
			}
		}
		timers.clear();
	}
	
}