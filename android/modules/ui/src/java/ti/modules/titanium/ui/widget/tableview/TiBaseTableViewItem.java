/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-current by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Handler;
import android.os.Message;
import android.view.ViewGroup;

@SuppressWarnings("deprecation")
public abstract class TiBaseTableViewItem extends ViewGroup implements Handler.Callback
{
	private static final String TAG = "TiBaseTableViewItem";

	private static Drawable childIndicatorDrawable = null;
	private static Drawable checkIndicatorDrawable = null;
	private static Resources resources = null;

	protected Handler handler;
	protected TiFileHelper tfh;
	protected String className;

	public TiBaseTableViewItem(Activity activity)
	{
		super(activity);
		this.handler = new Handler(this);

		if (resources == null) {
			resources = TiApplication.getInstance().getResources();
		}
		if (resources != null) {
			if (childIndicatorDrawable == null) {
				try {
					childIndicatorDrawable = resources.getDrawable(TiRHelper.getImageRessource("drawable.btn_more"));
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.btn_more' not found.");
				}
			}
			if (checkIndicatorDrawable == null) {
				try {
					checkIndicatorDrawable =
						resources.getDrawable(TiRHelper.getImageRessource("drawable.btn_check_buttonless_on"));
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.btn_check_buttonless_on' not found.");
				}
			}
		}
	}

	public abstract void setRowData(Item item);
	public abstract Item getRowData();

	public boolean handleMessage(Message msg)
	{
		return false;
	}

	public boolean hasSelector()
	{
		return false;
	}

	public Drawable getSelectorDrawable()
	{
		return null;
	}

	public String getLastClickedViewName()
	{
		return null;
	}

	public Drawable getHasChildDrawable()
	{
		return childIndicatorDrawable;
	}

	public Drawable getHasCheckDrawable()
	{
		return checkIndicatorDrawable;
	}

	public Drawable loadDrawable(String url)
	{
		if (tfh == null) {
			tfh = new TiFileHelper(getContext());
		}
		return tfh.loadDrawable(url, false);
	}

	public String getClassName()
	{
		return className;
	}

	public void setClassName(String className)
	{
		this.className = className;
	}

	public Drawable getBackgroundImageDrawable(KrollProxy proxy, String path)
	{
		String url = proxy.resolveUrl(null, path);
		return loadDrawable(url);
	}

	public void setBackgroundDrawable(KrollDict d, Drawable drawable)
	{
		StateListDrawable stateDrawable = new StateListDrawable();

		// use transparent highlight so the selector drawable is visible over background
		ColorDrawable transparent = new ColorDrawable(Color.TRANSPARENT);
		stateDrawable.addState(new int[] { android.R.attr.state_window_focused, android.R.attr.state_enabled,
										   android.R.attr.state_pressed },
							   transparent);
		stateDrawable.addState(new int[] { android.R.attr.state_selected }, transparent);

		stateDrawable.addState(new int[] { android.R.attr.state_focused, android.R.attr.state_window_focused,
										   android.R.attr.state_enabled },
							   drawable);
		stateDrawable.addState(new int[0], drawable);

		if (d.containsKey(TiC.PROPERTY_OPACITY)) {
			stateDrawable.setAlpha(Math.round(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY) * 255));
		}
		setBackgroundDrawable(stateDrawable);
	}

	public void setBackgroundFromProxy(KrollProxy proxy)
	{
		Drawable background = null;
		Object bkgdImage = proxy.getProperty(TiC.PROPERTY_BACKGROUND_IMAGE);
		Object bkgdColor = proxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR);
		if (bkgdImage != null) {
			background = getBackgroundImageDrawable(proxy, bkgdImage.toString());
		} else if (bkgdColor != null) {
			Integer bgColor = TiConvert.toColor(bkgdColor.toString());
			background = new ColorDrawable(bgColor);
		}

		setBackgroundDrawable(proxy.getProperties(), background);
	}

	public void release()
	{
		handler = null;
	}

	protected static void clearChildViews(TiViewProxy parent)
	{
		for (TiViewProxy childProxy : parent.getChildren()) {
			childProxy.setView(null);
			TiBaseTableViewItem.clearChildViews(childProxy);
		}
	}
}
