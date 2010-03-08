/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.titanium.TiDict;

public interface IKrollCallable {

	public void call();
	public void call(Object[] args);
	public void callWithProperties(TiDict data);
}
