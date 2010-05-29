/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

public interface ITiAppInfo {
	public String getId();
	public String getName();
	public String getVersion();
	public String getPublisher();
	public String getUrl();
	public String getCopyright();
	public String getDescription();
	public String getIcon();
	public boolean isAnalyticsEnabled();
	public String getGUID();
	public boolean isFullscreen();
	public boolean isNavBarHidden();
}
