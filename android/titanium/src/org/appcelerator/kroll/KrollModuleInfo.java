/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

/**
 * Holds info about a Kroll module
 */
public class KrollModuleInfo {
	protected String name, id, guid, version, description, author, license, copyright;
	
	public KrollModuleInfo(String name, String id, String guid, String version, String description, String author, String license, String copyright)
	{
		this.name = name;
		this.id = id;
		this.guid = guid;
		this.version = version;
		this.description = description;
		this.author = author;
		this.license = license;
		this.copyright = copyright;
	}

	public String getName() {
		return name;
	}
	
	public String getId() {
		return id;
	}

	public String getGuid() {
		return guid;
	}

	public String getVersion() {
		return version;
	}

	public String getDescription() {
		return description;
	}

	public String getAuthor() {
		return author;
	}

	public String getLicense() {
		return license;
	}

	public String getCopyright() {
		return copyright;
	}
}
