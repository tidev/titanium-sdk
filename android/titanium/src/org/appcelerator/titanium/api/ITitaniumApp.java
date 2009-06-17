/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumApp
{
	public String getID();
	public String getModuleName();
	public String getVersion();
	public String getPublisher();
	public String getURL();
	public String getDescription();
	public String getCopyright();
	public String getGUID();
	public String getStreamURL(String stream);
	public String appURLToPath(String url);

	//internal
	public void triggerLoad();
	public void setLoadOnPageEnd(boolean load);
	public ITitaniumProperties getAppProperties();
	public ITitaniumProperties getSystemProperties();
}
