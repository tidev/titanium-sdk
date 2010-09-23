/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Method;

import org.appcelerator.kroll.util.KrollReflectionUtils;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;

import android.app.Activity;

public class KrollReflectionProperty implements KrollDynamicProperty {
	private static final String TAG = "KrollReflectionProperty";
	
	protected boolean get, set, retain;
	protected String name;
	protected KrollProxy proxy;
	protected Method getMethod, setMethod;
	protected boolean runOnUiThread = false;
	protected boolean getMethodHasInvocation, setMethodHasInvocation;
	protected KrollNativeConverter nativeConverter;
	protected KrollJavascriptConverter javascriptConverter;
	protected KrollDefaultValueProvider[] getDefaultProviders;
	protected KrollDefaultValueProvider[] setDefaultProviders;
	
	public KrollReflectionProperty(KrollProxy proxy, String name, boolean get, boolean set, String getMethodName, String setMethodName, boolean retain) {
		this.name = name;
		this.get = get;
		this.set = set;
		this.proxy = proxy;
		
		if (get && getMethodName != null) {
			getMethod = KrollReflectionUtils.getMethod(proxy.getClass(), getMethodName);
			if (getMethod != null) {
				getMethodHasInvocation = getMethod.getParameterTypes().length > 0 && getMethod.getParameterTypes()[0].equals(KrollInvocation.class);
			}
		}
		if (set && setMethodName != null) {
			setMethod = KrollReflectionUtils.getMethod(proxy.getClass(), setMethodName);
			if (setMethod != null) {
				setMethodHasInvocation = setMethod.getParameterTypes().length > 0 && setMethod.getParameterTypes()[0].equals(KrollInvocation.class);
			}
		}
		this.retain = retain;
	}
	
	protected KrollDefaultValueProvider getDefaultValueProvider(Method method, int argIndex) {
		KrollDefaultValueProvider[] providers = method == getMethod ? getDefaultProviders : setDefaultProviders;
		if (providers == null || providers.length <= argIndex || providers[argIndex] == null) {
			return KrollConverter.getInstance();
		}
		
		return providers[argIndex];
	}
	
	protected Object safeInvoke(KrollInvocation invocation, Method method, Object... args) {
		try {
			Class<?>[] paramTypes = method.getParameterTypes();
			if (args.length < paramTypes.length) {
				Object newArgs[] = new Object[paramTypes.length];
				System.arraycopy(args, 0, newArgs, 0, args.length);
				
				// Append default values onto the end for dynamic getters/setters that have optional arguments
				for (int i = args.length; i < paramTypes.length; i++) {
					KrollDefaultValueProvider provider = getDefaultValueProvider(method, i);
					newArgs[i] = provider.getDefaultValue(paramTypes[i]);
				}
				args = newArgs;
			} else if (args.length > paramTypes.length) {
				// cut off the remaining args
				Object newArgs[] = new Object[paramTypes.length];
				System.arraycopy(args, 0, newArgs, 0, paramTypes.length);
				args = newArgs;
			}
			
			if (!runOnUiThread) {
				return nativeConverter.convertNative(invocation,
					method.invoke(proxy, args));
			} else {
				Activity activity = invocation.getTiContext().getActivity();
				if (invocation.getTiContext().isUIThread()) {
					return nativeConverter.convertNative(invocation,
						method.invoke(proxy, args));
				} else {
					final KrollInvocation fInv = invocation;
					final Object[] fArgs = args;
					final Method fMethod = method;
					final AsyncResult result = new AsyncResult();
					
					activity.runOnUiThread(new Runnable() {
						public void run() {
							try {
								Object retVal = nativeConverter.convertNative(fInv,
									fMethod.invoke(proxy, fArgs));
								result.setResult(retVal);
							} catch (Exception e) {
								result.setResult(e);
							}
						}
					});
					
					Object retVal = result.getResult();
					if (retVal instanceof Exception) {
						throw (Exception)retVal;
					} else {
						return retVal;
					}
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
			if (getMethodHasInvocation) {
				return safeInvoke(invocation, getMethod, invocation);
			} else {
				return safeInvoke(invocation, getMethod);
			}
		}
		
		return nativeConverter.convertNative(invocation, proxy.getProperty(name));
	}

	@Override
	public void set(KrollInvocation invocation, String name, Object value) {
		if (supportsSet(name)) {
			if (retain) {
				proxy.setProperty(name, value);
			}
			if (setMethodHasInvocation) {
				safeInvoke(invocation, setMethod, invocation, value);
			} else {
				safeInvoke(invocation, setMethod, value);
			}
			
		} else {
			Object convertedValue = javascriptConverter.convertJavascript(invocation, value, Object.class);
			proxy.setProperty(name, convertedValue, true);
		}
	}

	@Override
	public boolean supportsGet(String name) {
		return get && getMethod != null;
	}

	@Override
	public boolean supportsSet(String name) {
		return set && setMethod != null;
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

	public void setGetDefaultProviders(KrollDefaultValueProvider[] getDefaultProviders) {
		this.getDefaultProviders = getDefaultProviders;
	}
	
	public void setSetDefaultProviders(KrollDefaultValueProvider[] setDefaultProviders) {
		this.setDefaultProviders = setDefaultProviders;
	}
}
