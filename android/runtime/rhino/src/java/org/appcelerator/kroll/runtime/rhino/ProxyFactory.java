/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.HashMap;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.common.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

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

			if (exports != null) {
				String bindingName = KrollGeneratedBindings.getBindingName(proxyClassName);
				if (bindingName == null) {
					constructor = (Function) exports.get(proxyClassName, exports);

				} else {
					constructor = (Function) exports.get(bindingName, exports);
				}

			} else {
				// Fall back to our external / 3rd party modules
				exports = KrollBindings.getExternalBinding(context, scope, proxyClassName);

				if (exports != null) {
					Object ids[] = exports.getIds();
					/*
					String targetProxyClassName = "";
					for (int i = 0; i < ids.length; i++) {
						if (((String) ids[i]).equals(proxyClassName)) {
							targetProxyClassName = proxyClassName;
						}
					}

					constructor = (Function) ScriptableObject.getProperty(exports, targetProxyClassName);
					*/

					if (ids.length > 0) {
						// ....or just do this.  last element should be the "real" proxy (versus base
						// type) but leaving the above commented out and in place for the time being 
						// in case we need to revert to a more direct mechanism
						constructor = (Function) ScriptableObject.getProperty(exports, (String)(ids[ids.length - 1]));

					} else {
						Log.e(TAG, "Failed to find prototype class constructor for " + proxyClassName);
						return null;
					}

				} else {
					Log.e(TAG, "Failed to find prototype class for " + proxyClassName);
					return null;
				}
			}
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
