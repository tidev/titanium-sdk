/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.os.Handler;
import android.os.Message;

public class TiUIActivityIndicator extends TiUIView
	implements Handler.Callback
{
	private static final String LCAT = "TiUIActivityIndicator";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_SHOW = 100;
	private static final int MSG_PROGRESS = 101;
	private static final int MSG_HIDE = 102;

	public static final int INDETERMINANT = 0;
	public static final int DETERMINANT = 1;

	public static final int STATUS_BAR = 0;
	public static final int DIALOG = 1;

	protected Handler handler;

	protected boolean visible;
	protected ProgressDialog progressDialog;
	protected String statusBarTitle;
	protected int incrementFactor;
	protected int location;
	protected int min;
	protected int max;
	protected int type;

	public TiUIActivityIndicator(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating an activity indicator");
		}
		handler = new Handler(this);
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_SHOW : {
				handleShow();
				return true;
			}
			case MSG_PROGRESS : {
				if (progressDialog != null) {
					progressDialog.setProgress(msg.arg1);
				} else {
					Activity parent = (Activity) this.proxy.getContext();
					parent.setProgress(msg.arg1);
				}
				return true;
			}
			case MSG_HIDE : {
				handleHide();
				return true;
			}
		}

		return false;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		// Configure indicator on show.
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		if (key.equals("message")) {
			if (visible) {
				if (progressDialog != null) {
					progressDialog.setMessage((String) newValue);
				} else {
					Activity parent = (Activity) this.proxy.getContext();
					parent.setTitle((String) newValue);
				}
			}
		} else if (key.equals("value")) {
			if (visible) {
				int value = TiConvert.toInt(newValue);
				int thePos = (value - min) * incrementFactor;

				handler.obtainMessage(MSG_PROGRESS, thePos, -1).sendToTarget();
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void show(KrollDict options)
	{
		if (visible) {
			return;
		}

		handler.sendEmptyMessage(MSG_SHOW);
	}

	protected void handleShow() {
		KrollDict d = proxy.getProperties();

		String message = "";
		if (d.containsKey("message")) {
			message = d.getString("message");
		}

		location = DIALOG;
		if (d.containsKey("location")) {
			location = TiConvert.toInt(d, "location");
		}

		min = 0;
		if (d.containsKey("min")) {
			min = TiConvert.toInt(d,"min");
		}

		max = 100;
		if (d.containsKey("max")) {
			max = TiConvert.toInt(d, "max");
		}

		type = INDETERMINANT;
		if (d.containsKey("type")) {
			type = TiConvert.toInt(d, "type");
		}

		if (location == STATUS_BAR) {
			incrementFactor = 10000 / (max - min);
			Activity parent = (Activity) proxy.getContext();

			if (type == INDETERMINANT) {
				parent.setProgressBarIndeterminate(true);
				parent.setProgressBarIndeterminateVisibility(true);
				statusBarTitle = parent.getTitle().toString();
				parent.setTitle(message);
			} else if (type == DETERMINANT) {
				parent.setProgressBarIndeterminate(false);
				parent.setProgressBarIndeterminateVisibility(false);
				parent.setProgressBarVisibility(true);
				statusBarTitle = parent.getTitle().toString();
				parent.setTitle(message);
			} else {
				Log.w(LCAT, "Unknown type: " + type);
			}
		} else if (location == DIALOG) {
			incrementFactor = 1;
			if (progressDialog == null) {
				Context a = proxy.getTiContext().getTiApp().getCurrentActivity();
				if (a == null) {
					a = proxy.getTiContext().getRootActivity();
				}
				progressDialog = new ProgressDialog(a);
			}

			progressDialog.setMessage(message);
			progressDialog.setCancelable(false);

			if (type == INDETERMINANT) {
				progressDialog.setIndeterminate(true);
			} else if (type == DETERMINANT) {
				progressDialog.setIndeterminate(false);
				progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
				if (min != 0) {
					progressDialog.setMax(max-min); // no min setting so shift
				} else {
					progressDialog.setMax(max);
				}
				progressDialog.setProgress(0);
			} else {
				Log.w(LCAT, "Unknown type: " + type);
			}
			progressDialog.show();
		} else {
			Log.w(LCAT, "Unknown location: " + location);
		}
		visible = true;
	}

	public void hide(KrollDict options)
	{
		if (!visible) {
			return;
		}
		handler.sendEmptyMessage(MSG_HIDE);
	}

	protected void handleHide() {
		if (progressDialog != null) {
			progressDialog.dismiss();
			progressDialog = null;
		} else {
			Activity parent = (Activity) proxy.getContext();
			parent.setProgressBarIndeterminate(false);
			parent.setProgressBarIndeterminateVisibility(false);
			parent.setProgressBarVisibility(false);
			parent.setTitle(statusBarTitle);
			statusBarTitle = null;
		}
		visible = false;
	}
}
