/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.util.HashMap;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;

@Kroll.proxy(propertyAccessors = {
	"anim", "array", "attr", "color",
	"dimen", "drawable", "id", "integer",
	"layout", "string", "style", "styleable"
})
public class RProxy extends KrollProxy {
	private static final String TAG = "TiAndroidRProxy";
	private static final boolean DBG = TiConfig.LOGD;
	
	public static final int RESOURCE_TYPE_ANDROID = 0;
	public static final int RESOURCE_TYPE_APPLICATION = 1;
	
	protected String name;
	protected int resourceType;
	protected HashMap<String, RProxy> subResources = new HashMap<String, RProxy>();
	
	public RProxy(int resourceType) {
		this(resourceType, null);
	}
	
	protected RProxy(int resourceType, String name) {
		super();
		this.resourceType = resourceType;
		this.name = name;
	}

	// FIXME implement me for V8
	/*@Override
	public Object get(Scriptable scope, String name)
			throws NoSuchFieldException {
		if (!subResources.containsKey(name)) {
			String childName = this.name == null ? name : this.name + "." + name;
			subResources.put(name, new RProxy(getTiContext(), resourceType, childName));
		}
		return subResources.get(name);
	}*/

	public String getName() {
		return this.name;
	}

	public String toString() {
		return this.name;
	}


	// TODO ?
	public Object getNativeValue() {
		if (DBG) {
			Log.d(TAG, "Getting resource " + (resourceType==RESOURCE_TYPE_ANDROID ? "android.R." : "R.") + name);
		}
		try {
			if (resourceType == RESOURCE_TYPE_ANDROID) {
				return TiRHelper.getAndroidResource(this.name);
			} else {
				return TiRHelper.getApplicationResource(this.name);
			}
		} catch (ResourceNotFoundException e) {
			//return super.getNativeValue();
			return this;
		}
	}

	public int getResourceType()
	{
		return this.resourceType;
	}
}
