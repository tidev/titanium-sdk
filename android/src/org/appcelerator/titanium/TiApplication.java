/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.File;
import java.lang.Thread.UncaughtExceptionHandler;
import java.lang.reflect.Method;
import java.util.HashMap;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Application;

// Naming TiHost to more closely match other implementations
public class TiApplication extends Application
{
	private static final String LCAT = "TiApplication";

	private String baseUrl;
	private String startUrl;
	private HashMap<Class<?>, HashMap<String, Method>> methodMap;
	private TiRootActivity rootActivity;

	public TiApplication() {
		Log.checkpoint("checkpoint, app created.");
	}

	@Override
	public void onCreate()
	{
		super.onCreate();

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {

			public void uncaughtException(Thread t, Throwable e) {
				Log.e("TiUncaughtHandler", "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString());
				//postAnalyticsEvent(TitaniumAnalyticsEventFactory.createErrorEvent(t, e));
				defaultHandler.uncaughtException(t, e);
			}
		});

		//TODO read from tiapp.xml
		TiConfig.LOGD = true;

		baseUrl = "file:///android_asset/Resources/";

		File fullPath = new File(baseUrl, getStartFilename("app.js"));
		baseUrl = fullPath.getParent();

		methodMap = new HashMap<Class<?>, HashMap<String,Method>>(25);
	}

	public void setRootActivity(TiRootActivity rootActivity) {
		//TODO consider weakRef
		this.rootActivity = rootActivity;
	}

	public TiRootActivity getRootActivity() {
		return rootActivity;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public String getStartUrl() {
		return startUrl;
	}

	private String getStartFilename(String defaultStartFile) {
		return defaultStartFile;
	}

	public synchronized Method methodFor(Class<?> source, String name)
	{
		HashMap<String, Method> classMethods = methodMap.get(source);
		if (classMethods == null) {
			Method[] methods = source.getMethods();
			classMethods = new HashMap<String, Method>(methods.length);
			methodMap.put(source, classMethods);

			for(Method method : methods) {
				// TODO filter?
				//Log.e(LCAT, "Obj: " + source.getSimpleName() + " Method: " + method.getName());
				classMethods.put(method.getName(), method);
			}
		}

		return classMethods.get(name);
	}

	@Override
	public void onLowMemory()
	{
		super.onLowMemory();
	}

	@Override
	public void onTerminate() {
		super.onTerminate();
	}
}
