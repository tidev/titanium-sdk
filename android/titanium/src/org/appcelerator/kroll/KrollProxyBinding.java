/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;

import org.appcelerator.titanium.kroll.KrollBridge;

public interface KrollProxyBinding {
	public void bindToParent(KrollProxy parent, KrollProxy proxy);
	public void bindProperties(KrollProxy proxy, List<String> filteredBindings);
	public void bindContextSpecific(KrollBridge bridge, KrollProxy proxy);
	
	public String getAPIName();
}
