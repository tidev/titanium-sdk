/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Scriptable;

public interface KrollProxyBinding {
	public void bind(Scriptable scope, KrollProxy rootObject, KrollProxy proxy);
}
