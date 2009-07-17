/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumMenuItem;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import android.webkit.WebView;

public class TitaniumMenuItem implements ITitaniumMenuItem
{

	private static final String LCAT = "TiMenuItem";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	WeakReference<WebView> weakWebView;

	protected AtomicInteger counter; // Used to create IDs unique within a menu hierarchy

	protected int itemId;
	protected String label;
	protected String iconUrl;
	protected String callback;
	protected ArrayList<TitaniumMenuItem> menuItems;

	protected boolean enabled;

	enum MenuType { ROOT, SEPARATOR, SUBMENU, ITEM	};

	MenuType menuType;

	public TitaniumMenuItem(WebView webView, AtomicInteger counter)
	{
		this(webView, counter, MenuType.ROOT);
	}

	public TitaniumMenuItem(WebView webView, AtomicInteger counter, MenuType menuType)
	{
		this.counter = counter;
		this.weakWebView = new WeakReference<WebView>(webView);
		this.itemId = counter.incrementAndGet();
		this.menuItems = new ArrayList<TitaniumMenuItem>();
		this.enabled = true;
		this.menuType = menuType;
	}

	public ITitaniumMenuItem addItem(String label, String callback, String iconUrl)
	{
		WebView webView = weakWebView.get();
		TitaniumMenuItem item = null;

		if (webView != null) {
			item = new TitaniumMenuItem(webView, counter, MenuType.ITEM);
			item.setLabel(label);
			item.setIcon(iconUrl);
			item.setCallback(callback);
			menuItems.add(item);
		} else {
			Log.w(LCAT, "WebView is null, must have been GC'd.");
		}

		return item;
	}

	public ITitaniumMenuItem addSeparator()
	{
		WebView webView = weakWebView.get();
		TitaniumMenuItem item = null;

		if (webView != null) {
			item = new TitaniumMenuItem(webView, counter, MenuType.SEPARATOR);
			menuItems.add(item);
		} else {
			Log.w(LCAT, "WebView is null, must have been GC'd.");
		}


		return item;
	}

	public ITitaniumMenuItem addSubMenu(String label, String iconUrl)
	{
		WebView webView = weakWebView.get();
		TitaniumMenuItem item = null;

		if (webView != null) {
			item = new TitaniumMenuItem(webView, counter, MenuType.SUBMENU);
			item.setLabel(label);
			item.setIcon(iconUrl);
			menuItems.add(item);
		} else {
			Log.w(LCAT, "WebView is null, must have been GC'd.");
		}

		return item;
	}

	public void disable() {
		enabled = false;
	}

	public void enable() {
		enabled = true;
	}

	public boolean isRoot() {
		return menuType == MenuType.ROOT;
	}

	public boolean isItem() {
		return menuType == MenuType.ITEM;
	}

	public boolean isSeparator() {
		return menuType == MenuType.SEPARATOR;
	}

	public boolean isSubMenu() {
		return menuType == MenuType.SUBMENU;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public void setIcon(String iconUrl)
	{
		this.iconUrl = iconUrl;
	}

	public void setLabel(String label)
	{
		this.label = label;
	}

	public void setCallback(String callback) {
		this.callback = callback;
	}

	public String getLabel() {
		return label;
	}

	public String getIcon() {
		return iconUrl;
	}

	public String getCallback() {
		return callback;
	}

	// There should be no setMenuType, it's fixed at construction
	protected MenuType getMenuType() {
		return menuType;
	}

	public ArrayList<TitaniumMenuItem> getMenuItems() {
		return menuItems;
	}

	// There should be no setItemId, it's generated in the constructor
	public int getItemId() {
		return itemId;
	}
}
