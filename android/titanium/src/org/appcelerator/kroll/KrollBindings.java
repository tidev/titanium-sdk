/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.titanium.TiContext;
import org.mozilla.javascript.Scriptable;

public interface KrollBindings {
	public void initBindings(TiContext context, Scriptable scope, KrollProxy proxy);
	public KrollProxyBinding getBinding(Class<? extends KrollProxy> proxyClass);
	public KrollProxyBinding getBinding(KrollProxy proxy);
}
