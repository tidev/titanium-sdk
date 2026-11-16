/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * 
 * Copied and modified from Apache's HTTPClient implementation (APL2 license):
 * org.apache.http.NameValuePair
 */

package ti.modules.titanium.network.httpurlconnection;

public class NameValuePair
{

	private String name;
	private String value;

	public NameValuePair()
	{
		this(null, null);
	}

	public NameValuePair(String name, String value)
	{
		this.name = name;
		this.value = value;
	}

	public void setName(String name)
	{
		this.name = name;
	}

	public String getName()
	{
		return name;
	}

	public void setValue(String value)
	{
		this.value = value;
	}

	public String getValue()
	{
		return value;
	}

	@Override
	public String toString()
	{
		return ("name=" + name + ", "
				+ "value=" + value);
	}
}
