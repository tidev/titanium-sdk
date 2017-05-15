/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.util.DisplayMetrics;
import android.view.ViewGroup;

@SuppressWarnings("deprecation")
public abstract class TiBaseTableViewItem extends ViewGroup implements Handler.Callback
{
	private static final String TAG = "TiBaseTableViewItem";

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
				int density = TiPlatformHelper.applicationLogicalDensity;
				if (childIndicatorBitmap == null) {
					String path = "/org/appcelerator/titanium/res/drawable/btn_more_48.png"; // default medium

					switch (density) {
						case DisplayMetrics.DENSITY_HIGH : path = "/org/appcelerator/titanium/res/drawable/btn_more_72.png"; break;
						case DisplayMetrics.DENSITY_MEDIUM : path = "/org/appcelerator/titanium/res/drawable/btn_more_48.png"; break;
						case DisplayMetrics.DENSITY_LOW : path = "/org/appcelerator/titanium/res/drawable/btn_more_36.png"; break;
					}

					if (Build.VERSION.SDK_INT >= 9 && density == DisplayMetrics.DENSITY_XHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_more_96.png";
					}

					if (Build.VERSION.SDK_INT >= 16 && density >= DisplayMetrics.DENSITY_XXHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_more_144.png";
					}

					if (Build.VERSION.SDK_INT >= 16 && density >= DisplayMetrics.DENSITY_XXXHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_more_192.png";
					}

					childIndicatorBitmap = BitmapFactory.decodeStream(KrollDict.class.getResourceAsStream(path));
				}
				if (checkIndicatorBitmap == null) {
					String path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_48.png"; // default medium
					switch (density) {
						case DisplayMetrics.DENSITY_HIGH : path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_72.png"; break;
						case DisplayMetrics.DENSITY_MEDIUM : path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_48.png"; break;
						case DisplayMetrics.DENSITY_LOW : path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_36.png"; break;
					}

					if (Build.VERSION.SDK_INT >= 9 && density == DisplayMetrics.DENSITY_XHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_96.png";
					}

					if (Build.VERSION.SDK_INT >= 16 && density >= DisplayMetrics.DENSITY_XXHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_144.png";
					}

					if (Build.VERSION.SDK_INT >= 18 && density >= DisplayMetrics.DENSITY_XXXHIGH) {
						path = "/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on_192.png";
					}


					checkIndicatorBitmap = BitmapFactory.decodeStream(KrollDict.class.getResourceAsStream(path));
				}
			}
		}
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
				Log.e(TAG, t.getClass().getName() + ": " + t.getMessage(), t);
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

		// use transparent highlight so the selector drawable is visible over background
		ColorDrawable transparent = new ColorDrawable(Color.TRANSPARENT);
		stateDrawable.addState(new int[] { android.R.attr.state_window_focused, android.R.attr.state_enabled,
			android.R.attr.state_pressed }, transparent);
		stateDrawable.addState(new int[] { android.R.attr.state_selected }, transparent);

		stateDrawable.addState(new int[] { android.R.attr.state_focused, android.R.attr.state_window_focused,
			android.R.attr.state_enabled }, drawable);
		stateDrawable.addState(new int[0], drawable);

		if (d.containsKey(TiC.PROPERTY_OPACITY)) {
			stateDrawable.setAlpha(Math.round(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY) * 255));
		}
		setBackgroundDrawable(stateDrawable);
	}

	public void setBackgroundFromProxy(KrollProxy proxy) {
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

	public void release() {
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
