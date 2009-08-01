/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

public abstract class TitaniumNotifier implements ITitaniumNotifier
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiNotifier";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected TitaniumModuleManager tmm;
	protected boolean showing;
	protected String callback;
	protected int delay;
	protected String iconUrl;
	protected String message;
	protected String title;
	protected TitaniumJSEventManager eventListeners;

	public TitaniumNotifier(TitaniumModuleManager tmm) {
		this.tmm = tmm;
		showing = false;
		delay = 0;
		eventListeners = new TitaniumJSEventManager(tmm.getWebView());
	}

	public void addEventListener(String eventName, String listener) {
		eventListeners.addListener(eventName, listener);
	}
	public void setCallback(String callback)
	{
		this.callback = callback;
	}

	protected int getDelay()
	{
		return this.delay;
	}
	public void setDelay(int delay)
	{
		this.delay = delay;
	}

	protected String getIcon() {
		return this.iconUrl;
	}
	public void setIcon(String iconUrl) {
		this.iconUrl = iconUrl;
	}

	protected String getMessage()
	{
		return this.message;
	}
	public void setMessage(String message) {
		this.message = message;
	}

	protected String getTitle()
	{
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	abstract public void show(boolean animate, boolean autohide);
	abstract public void hide(boolean animate);
}
