/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.File;
import java.lang.Thread.UncaughtExceptionHandler;
import java.lang.ref.SoftReference;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.ITiWindowHandler;

import android.app.Application;
import android.os.Process;

// Naming TiHost to more closely match other implementations
public class TiApplication extends Application
{
	private static final String LCAT = "TiApplication";

	private String baseUrl;
	private String startUrl;
	private HashMap<Class<?>, HashMap<String, Method>> methodMap;
	private HashMap<String, SoftReference<TiProxy>> proxyMap;
	private TiRootActivity rootActivity;
	private TiProperties appProperties;
	private ITiWindowHandler windowHandler;

	public TiApplication() {
		Log.checkpoint("checkpoint, app created.");
	}

	@Override
	public void onCreate()
	{
		super.onCreate();
		final TiApplication me = this;

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {

			public void uncaughtException(Thread t, Throwable e) {
				Log.e("TiUncaughtHandler", "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString(), e);
				//postAnalyticsEvent(TitaniumAnalyticsEventFactory.createErrorEvent(t, e));
				defaultHandler.uncaughtException(t, e);
				//Process.killProcess(Process.myPid());
			}
		});

		//TODO read from tiapp.xml
		TiConfig.LOGD = true;

		baseUrl = "file:///android_asset/Resources/";

		File fullPath = new File(baseUrl, getStartFilename("app.js"));
		baseUrl = fullPath.getParent();

		methodMap = new HashMap<Class<?>, HashMap<String,Method>>(25);
		proxyMap = new HashMap<String, SoftReference<TiProxy>>(5);

		appProperties = new TiProperties(getApplicationContext(), "titanium", false);
	}

	public void setRootActivity(TiRootActivity rootActivity) {
		//TODO consider weakRef
		this.rootActivity = rootActivity;
		this.windowHandler = rootActivity;
	}

	public TiRootActivity getRootActivity() {
		return rootActivity;
	}

	public ITiWindowHandler getWindowHandler() {
		return windowHandler;
	}

	public void setWindowHandler(ITiWindowHandler windowHandler) {
		if (windowHandler == null) {
			this.windowHandler = rootActivity;
		} else {
			this.windowHandler = windowHandler; //TODO weakRef?
		}
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

			// we need to sort methods by their implementation order
			// i.e. subClass > superClass precedence
			final HashMap<Class<?>, Integer> hierarchy = new HashMap<Class<?>, Integer>();
			int i = 0;
			hierarchy.put(source, 0);
			for (Class<?> superClass = source.getSuperclass(); superClass != null;
				superClass = superClass.getSuperclass())
			{
				hierarchy.put(superClass, ++i);
			}

			Comparator<Method> comparator = new Comparator<Method>()
			{
				public int compare(Method o1, Method o2) {
					int h1 = hierarchy.get(o1.getDeclaringClass());
					int h2 = hierarchy.get(o2.getDeclaringClass());
					return h1-h2;
				}
			};

			List<Method> methodList = Arrays.asList(methods);
			Collections.sort(methodList, comparator);
			Collections.reverse(methodList);

			for(Method method : methodList) {
				// TODO filter?
				//Log.e(LCAT, "Obj: " + source.getSimpleName() + " Method: " + method.getName());
				classMethods.put(method.getName(), method);
			}
		}

		return classMethods.get(name);
	}

	private ArrayList<TiProxy> appEventProxies = new ArrayList<TiProxy>();
	public void addAppEventProxy(TiProxy appEventProxy)
	{
		appEventProxies.add(appEventProxy);
	}

	public void removeAppEventProxy(TiProxy appEventProxy)
	{
		appEventProxies.remove(appEventProxy);
	}

	public void fireAppEvent(String eventName, TiDict data)
	{
		for (TiProxy appEventProxy : appEventProxies)
		{
			appEventProxy.getTiContext().dispatchEvent(eventName, data);
		}
	}

	public TiProperties getAppProperties()
	{
		return appProperties;
	}

	public void registerProxy(TiProxy proxy) {
		String proxyId = proxy.proxyId;
		if (!proxyMap.containsKey(proxyId)) {
			proxyMap.put(proxyId, new SoftReference<TiProxy>(proxy));
		}
	}

	public TiProxy unregisterProxy(String proxyId) {
		TiProxy proxy = null;

		SoftReference<TiProxy> ref = proxyMap.remove(proxyId);
		if (ref != null) {
			proxy = ref.get();
		}

		return proxy;
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
