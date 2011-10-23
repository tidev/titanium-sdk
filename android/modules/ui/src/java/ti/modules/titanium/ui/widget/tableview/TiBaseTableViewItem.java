/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.R;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Handler;
import android.os.Message;
import android.util.DisplayMetrics;
import android.view.ViewGroup;

public abstract class TiBaseTableViewItem extends ViewGroup implements Handler.Callback
{
	private static final String LCAT = "TiBaseTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static Bitmap childIndicatorBitmap = null;
	private static Bitmap checkIndicatorBitmap = null;
	
	protected Handler handler;
	protected TiFileHelper tfh;
	protected String className;

	public TiBaseTableViewItem(Activity activity)
	{
		super(activity);
		this.handler = new Handler(this);
		
		if (TiBaseTableViewItem.childIndicatorBitmap == null || TiBaseTableViewItem.checkIndicatorBitmap == null) {
			synchronized(TiBaseTableViewItem.class) {
				// recheck to so we don't leak a bitmap.
				
				if (childIndicatorBitmap == null) {
					String path = "/org/appcelerator/titanium/res/drawable/btn_more.png"; // default medium
					switch (TiPlatformHelper.applicationLogicalDensity) {
						case DisplayMetrics.DENSITY_HIGH : path = "/org/appcelerator/titanium/res/drawable/btn_more_48.png"; break;
						case DisplayMetrics.DENSITY_LOW : path = "/org/appcelerator/titanium/res/drawable/btn_more_18.png"; break;
					}
					childIndicatorBitmap = BitmapFactory.decodeStream(KrollDict.class.getResourceAsStream(path));
				}
				if (checkIndicatorBitmap == null) {
					String path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on.png"; // default medium
					switch (TiPlatformHelper.applicationLogicalDensity) {
						case DisplayMetrics.DENSITY_HIGH : path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_48.png"; break;
						case DisplayMetrics.DENSITY_LOW : path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_1ow 8.png"; break;
					}
					checkIndicatorBitmap = BitmapFactory.decodeStream(KrollDict.class.getResourceAsStream(path));					
				}
			}
		}
	}

	public TiBaseTableViewItem(TiContext tiContext, Activity activity)
	{
		this(activity);
	}

	public abstract void setRowData(Item item);
	public abstract Item getRowData();
	
	public boolean handleMessage(Message msg) {
		return false;
	}

	public boolean hasSelector() {
		return false;
	}

	public Drawable getSelectorDrawable() {
		return null;
	}
	
	public String getLastClickedViewName() {
		return null;
	}

	private BitmapDrawable createDrawable(Bitmap bitmap) {
		try {
			return new BitmapDrawable(bitmap);
		} catch (Throwable t) {
			try {
				Log.e(LCAT, t.getClass().getName() + ": " + t.getMessage(), t);
				return null;
			} catch(Exception e) {
				// ignore - logging failed
				return null;
			}
		} 
	}
	
	public BitmapDrawable createHasChildDrawable() {
		return createDrawable(childIndicatorBitmap);
	}
	
	public BitmapDrawable createHasCheckDrawable() {
		return createDrawable(checkIndicatorBitmap);
	}

	public Drawable loadDrawable(String url) {
		if (tfh == null) {
			tfh = new TiFileHelper(getContext());
		}
		return tfh.loadDrawable(url, false);
	}

	public String getClassName() {
		return className;
	}

	public void setClassName(String className) {
		this.className = className;
	}
	
	public Drawable getBackgroundImageDrawable(KrollProxy proxy, String path) {
		String url = proxy.resolveUrl(null, path);
		return loadDrawable(url);
	}

	public void setBackgroundDrawable(KrollDict d, Drawable drawable)
	{
		StateListDrawable stateDrawable = new StateListDrawable();

		if (d.containsKey(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE)
		|| d.containsKey(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)) {
			// use transparent highlight selector drawable is visible over background
			ColorDrawable transparent = new ColorDrawable(Color.TRANSPARENT);
			stateDrawable.addState(new int[] {
				android.R.attr.state_window_focused,
				android.R.attr.state_enabled,
				android.R.attr.state_pressed }, transparent);
			stateDrawable.addState(new int[] { android.R.attr.state_selected }, transparent);
		}
		else
		{
			// set default drawable to system default manually so it works with custom background
			Drawable defaultDrawable = getResources().getDrawable(R.drawable.list_selector_background);
			stateDrawable.addState(new int[] {
				android.R.attr.state_window_focused,
				android.R.attr.state_enabled,
				android.R.attr.state_pressed }, defaultDrawable);
			stateDrawable.addState(new int[] { android.R.attr.state_selected }, defaultDrawable);
		}

		stateDrawable.addState(new int[] {
			android.R.attr.state_focused,
			android.R.attr.state_window_focused,
			android.R.attr.state_enabled }, drawable);
		stateDrawable.addState(new int[0], drawable);

		if (d.containsKey(TiC.PROPERTY_OPACITY))
		{
			stateDrawable.setAlpha(Math.round(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY) * 255));
		}
		setBackgroundDrawable(stateDrawable);
	}

	public void setBackgroundFromProxy(KrollProxy proxy) {
		Drawable background = null;
		if (proxy.hasProperty(TiC.PROPERTY_BACKGROUND_IMAGE)) {
			background = getBackgroundImageDrawable(proxy, proxy.getProperty(TiC.PROPERTY_BACKGROUND_IMAGE).toString());
		} else if (proxy.hasProperty(TiC.PROPERTY_BACKGROUND_COLOR)) {
			Integer bgColor = TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR).toString());
			background = new ColorDrawable(bgColor);
		}

		// TODO setBackgroundDrawable(props, background);
	}
	
	public void release() {
		handler = null;
	}
}
