/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public class KrollInvocation
{
	private String sourceUrl;

	public KrollInvocation(String sourceUrl)
	{
		this.sourceUrl = sourceUrl;
	}

	public String getSourceUrl()
	{
		return sourceUrl;
	}
}
