/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.TiConfig;

import android.content.Context;
import android.graphics.drawable.BitmapDrawable;
import android.os.Handler;
import android.os.Message;
import android.widget.FrameLayout;

public abstract class TiBaseTableViewItem extends FrameLayout implements Handler.Callback
{
	private static final String LCAT = "TitaniamBaseTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;

	protected Handler handler;

	public TiBaseTableViewItem(Context context)
	{
		super(context);

		this.handler = new Handler(this);
	}

	public abstract void setRowData(TiTableViewItemOptions defaults, TiDict template, TiDict data);

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

	public BitmapDrawable createHasChildDrawable() {
		return new BitmapDrawable(TiDict.class.getResourceAsStream("/org/appcelerator/titanium/res/drawable/btn_more.png"));
	}
}
