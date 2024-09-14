/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

/**
 * Holds info about a Kroll module
 */
public class KrollModuleInfo
{
	protected String name, id, guid, version, description, author, license, copyright, licenseKey;
	protected boolean isJSModule = false;

	public KrollModuleInfo(String name, String id, String guid, String version, String description, String author,
						   String license, String copyright)
	{
		this.name = name;
		this.id = id;
		this.guid = guid;
		this.version = version;
		this.description = description;
		this.author = author;
		this.license = license;
		this.copyright = copyright;
		this.licenseKey = null;
		this.isJSModule = false;
	}

	public String getName()
	{
		return name;
	}

	public String getId()
	{
		return id;
	}

	public String getGuid()
	{
		return guid;
	}

	public String getVersion()
	{
		return version;
	}

	public String getDescription()
	{
		return description;
	}

	public String getAuthor()
	{
		return author;
	}

	public String getLicense()
	{
		return license;
	}

	public String getCopyright()
	{
		return copyright;
	}

	public String getLicenseKey()
	{
		return licenseKey;
	}

	public void setLicenseKey(String licenseKey)
	{
		this.licenseKey = licenseKey;
	}

	public boolean getIsJSModule()
	{
		return this.isJSModule;
	}

	public void setIsJSModule(boolean value)
	{
		this.isJSModule = value;
	}
}
