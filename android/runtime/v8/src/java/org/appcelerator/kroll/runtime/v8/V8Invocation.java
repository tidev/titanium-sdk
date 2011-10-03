/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.runtime.v8;


public class V8Invocation
{
	private String sourceUrl = "";

	public V8Invocation(String sourceUrl)
	{
		this.sourceUrl = sourceUrl;
	}

	public String getSourceUrl()
	{
		return sourceUrl;
	}
}

