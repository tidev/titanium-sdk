/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumPlatform
{
	public String getOsType();
	public String getModuleName();
	public String getVersion();
	public String getArchitecture();
	public String getAddress();
	public String getId();
	public String getMacAddress();
	public int getProcessorCount();
	public String getUsername();
	public String createUUID();
	public double getAvailableMemory();
	public String getModel();

	public boolean openApplication(String app);
	public boolean openUrl(String url);

	// A method used to list app names that can be fed to openApplication
	public void logInstalledApplicationNames();

}
