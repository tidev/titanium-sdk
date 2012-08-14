/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import org.apache.http.MethodNotSupportedException;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.xml.DocumentProxy;
import ti.modules.titanium.network.HTTPClientProxy;

@Kroll.proxy(creatableInModule=NetworkModule.class)
public class PersistentHTTPClientProxy extends HTTPClientProxy
{
	public PersistentHTTPClientProxy()
	{
		super();
		this.client = new TiPersistentHTTPClient(this);
	}

	public PersistentHTTPClientProxy(TiContext tiContext)
	{
		this();
	}
}
