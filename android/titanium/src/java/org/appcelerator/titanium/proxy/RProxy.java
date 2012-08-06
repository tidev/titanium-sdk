/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.util.Arrays;
import java.util.HashMap;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;

@Kroll.proxy
public class RProxy extends KrollProxy
{
	private static final String TAG = "TiAndroidRProxy";

	private static final String[] RESOURCE_TYPES = {
		"anim", "array", "attr", "color",
		"dimen", "drawable", "id", "integer",
		"layout", "string", "style", "styleable"
	};

	public static final int RESOURCE_TYPE_ANDROID = 0;
	public static final int RESOURCE_TYPE_APPLICATION = 1;

	protected String name;
	protected int resourceType;
	protected HashMap<String, Object> subResources = new HashMap<String, Object>();

	public RProxy(int resourceType)
	{
		this(resourceType, null);
	}

	protected RProxy(int resourceType, String name)
	{
		super();
		this.resourceType = resourceType;
		this.name = name;
	}

	@Kroll.interceptor
	public Object get(String name)
	{
		if (this.name == null && Arrays.binarySearch(RESOURCE_TYPES, name) < 0) {
			return KrollRuntime.DONT_INTERCEPT;
		}

		Object value = subResources.get(name);
		if (value == null) {
			if (this.name != null) {
				value = getResourceValue(name);
				if (value == null) {
					return KrollRuntime.DONT_INTERCEPT;
				}

			} else {
				value = new RProxy(resourceType, name);
			}

			subResources.put(name, value);
		}

		return value;
	}

	public String getName()
	{
		return this.name;
	}

	public String toString()
	{
		return this.name;
	}

	private Object getResourceValue(String name)
	{
		Log.d(TAG, "Getting resource " + (resourceType == RESOURCE_TYPE_ANDROID ? "android.R." : "R.") + name, Log.DEBUG_MODE);

		try {
			if (resourceType == RESOURCE_TYPE_ANDROID) {
				return TiRHelper.getAndroidResource(this.name + "." + name);

			} else {
				return TiRHelper.getApplicationResource(this.name + "." + name);
			}
		} catch (ResourceNotFoundException e) {
			return null;
		}
	}

	public int getResourceType()
	{
		return this.resourceType;
	}
}
