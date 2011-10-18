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
		Class<?> proxyClass = proxySupport.getClass();
		String proxyClassName = proxyClass.getName();

		Function constructor = proxyConstructors.get(proxyClassName);
		if (constructor == null) {
			Scriptable exports = KrollBindings.getBinding(context, scope, proxyClassName);
			if (exports == null) {
				Log.e(TAG, "Failed to find prototype class for " + proxyClass.getName());
				return null;
			}

			Object[] ids = exports.getIds();
			if (ids.length >= 1) {
				constructor = (Function) exports.get(ids[0].toString(), exports);
			}
		}

		return (Proxy) constructor.construct(context, scope, new Object[] { proxySupport });
	}

	public static void addProxyConstructor(String proxyClassName, Function constructor)
	{
		proxyConstructors.put(proxyClassName, constructor);
	}
}
