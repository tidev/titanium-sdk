/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network.socket;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;

import ti.modules.titanium.network.NetworkModule;


@Kroll.module(parentModule=NetworkModule.class)
public class SocketModule extends KrollModule
{
	private static final String LCAT = "SocketModule";
	private static final boolean DBG = TiConfig.LOGD;


	public SocketModule(TiContext tiContext)
	{
		super(tiContext);
	}
}
