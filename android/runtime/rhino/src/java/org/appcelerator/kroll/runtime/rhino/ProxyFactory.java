/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.HashMap;

import org.appcelerator.kroll.KrollProxySupport;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

import android.util.Log;

/**
 * A factory for Rhino proxy objects
 */
public class ProxyFactory
{
	private static final String TAG = "ProxyFactory";
	private static HashMap<String, Function> proxyConstructors = new HashMap<String, Function>();

	public static Proxy createRhinoProxy(Context context, Scriptable scope, KrollProxySupport proxySupport)
	{
		return createRhinoProxy(context, scope, proxySupport.getClass().getName(), new Object[] { proxySupport });
	}

	public static Proxy createRhinoProxy(Context context, Scriptable scope, String proxyClassName)
	{
		return createRhinoProxy(context, scope, proxyClassName, new Object[0]);
	}

	public static Proxy createRhinoProxy(Context context, Scriptable scope, String proxyClassName, Object[] args)
	{
		Function constructor = proxyConstructors.get(proxyClassName);
		if (constructor == null) {
			Scriptable exports = KrollBindings.getBinding(context, scope, proxyClassName);
			if (exports == null) {
				Log.e(TAG, "Failed to find prototype class for " + proxyClassName);
				return null;
			}

			String bindingName = KrollGeneratedBindings.getBindingName(proxyClassName);
			constructor = (Function) exports.get(bindingName, exports);
		}

		return (Proxy) constructor.construct(context, scope, args);
	}

	public static void addProxyConstructor(String proxyClassName, Function constructor)
	{
		proxyConstructors.put(proxyClassName, constructor);
	}

	public static void dispose()
	{
		proxyConstructors.clear();
	}
}
