/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

public interface ITiAppInfo {
	String getId();
	String getName();
	String getVersion();
	String getPublisher();
	String getUrl();
	String getCopyright();
	String getDescription();
	String getIcon();
	boolean isAnalyticsEnabled();
	String getGUID();
	boolean isFullscreen();
	String getDeployType();
	String getBuildType();
}
