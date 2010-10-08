/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;

import android.app.Activity;

public abstract class KrollDynamicProperty implements KrollProperty {
	private static final String TAG = "KrollReflectionProperty";
	
	protected static final String GET = "get";
	protected static final String SET = "set";
	
	protected boolean get, set, retain;
	protected String name;
	protected boolean runOnUiThread = false;
	//protected boolean getMethodHasInvocation, setMethodHasInvocation;
	protected KrollNativeConverter nativeConverter;
	protected KrollJavascriptConverter javascriptConverter;
	
	public KrollDynamicProperty(String name, boolean get, boolean set, boolean retain) {
		this.name = name;
		this.get = get;
		this.set = set;
		this.retain = retain;
	}
	
	protected Object safeInvoke(KrollInvocation invocation, String method, Object value) {
		try {
			if (!runOnUiThread) {
				if (method.equals(GET)) {
					return dynamicGet(invocation);
				} else {
					dynamicSet(invocation, value);
					return null;
				}
			} else {
				Activity activity = invocation.getTiContext().getActivity();
				if (invocation.getTiContext().isUIThread()) {
					if (method.equals(GET)) {
						return dynamicGet(invocation);
					} else {
						dynamicSet(invocation, value);
						return null;
					}
				} else {
					final KrollInvocation fInv = invocation;
					final Object fValue = value;
					final String fMethod = method;
					final AsyncResult result = new AsyncResult();
					
					activity.runOnUiThread(new Runnable() {
						public void run() {
							try {
								if (fMethod.equals(GET)) {
									Object retVal = dynamicGet(fInv);
									result.setResult(retVal);
								} else {
									dynamicSet(fInv, fValue);
									result.setResult(null);
								}
							} catch (Exception e) {
								result.setException(e);
							}
						}
					});
					
					return result.getResult();
				}
			}
		} catch (Exception e) {
			Log.e(TAG, "Exception getting/setting property: " + name, e);
			Context.throwAsScriptRuntimeEx(e);
			return KrollProxy.UNDEFINED;
		}
	}
	
	@Override
	public Object get(KrollInvocation invocation, String name) {
		if (supportsGet(name)) {
			return safeInvoke(invocation, GET, null);
		}
		
		return nativeConverter.convertNative(invocation, invocation.getProxy().getProperty(name));
	}

	public abstract Object dynamicGet(KrollInvocation invocation);
	
	@Override
	public void set(KrollInvocation invocation, String name, Object value) {
		if (supportsSet(name)) {
			if (retain) {
				invocation.getProxy().setProperty(name, value);
			}
			safeInvoke(invocation, SET, value);
		} else {
			Object convertedValue = javascriptConverter.convertJavascript(invocation, value, Object.class);
			invocation.getProxy().setProperty(name, convertedValue, true);
		}
	}
	
	public abstract void dynamicSet(KrollInvocation invocation, Object value);

	@Override
	public boolean supportsGet(String name) {
		return get;
	}

	@Override
	public boolean supportsSet(String name) {
		return set;
	}

	public void setRunOnUiThread(boolean runOnUiThread) {
		this.runOnUiThread = runOnUiThread;
	}

	public void setNativeConverter(KrollNativeConverter nativeConverter) {
		this.nativeConverter = nativeConverter;
	}

	public void setJavascriptConverter(KrollJavascriptConverter javascriptConverter) {
		this.javascriptConverter = javascriptConverter;
	}
}
