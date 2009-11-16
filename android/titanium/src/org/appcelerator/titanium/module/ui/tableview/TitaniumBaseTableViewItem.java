/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui.tableview;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.json.JSONObject;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.widget.FrameLayout;

public abstract class TitaniumBaseTableViewItem extends FrameLayout implements Handler.Callback
{
	private static final String LCAT = "TitaniamBaseTableViewItem";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected Handler handler;

	public TitaniumBaseTableViewItem(Context context)
	{
		super(context);

		this.handler = new Handler(this);
	}

	public abstract void setRowData(TitaniumTableViewItemOptions defaults, JSONObject template, JSONObject data);

	public boolean handleMessage(Message msg)
	{
		return false;
	}

	public boolean providesOwnSelector() {
		return false;
	}

	public String getLastClickedViewName() {
		return null;
	}
}
