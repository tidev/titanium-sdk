/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

/**
 * This interface represents the various APIs needed by KrollRuntime
 * on a specific Proxy instance (and hides KrollProxy)
 */
public interface KrollProxySupport
{
	public void onPropertyChanged(String name, Object value);

	public void onPropertiesChanged(Object[][] changes);

	public KrollObject getKrollObject();

	public void setKrollObject(KrollObject object);

	public Object getIndexedProperty(int index);

	public void setIndexedProperty(int index, Object value);
}
