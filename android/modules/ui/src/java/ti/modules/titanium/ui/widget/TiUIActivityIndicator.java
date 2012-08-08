/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLaunchActivity;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;

public class TiUIActivityIndicator extends TiUIView
	implements Handler.Callback, DialogInterface.OnCancelListener
{
	private static final String TAG = "TiUIActivityIndicator";

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
		Log.d(TAG, "Creating an activity indicator", Log.DEBUG_MODE);
		handler = new Handler(Looper.getMainLooper(), this);
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
					Activity parent = (Activity) this.proxy.getActivity();
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
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);

		if (key.equals("message")) {
			if (visible) {
				if (progressDialog != null) {
					progressDialog.setMessage((String) newValue);

				} else {
					Activity parent = (Activity) this.proxy.getActivity();
					parent.setTitle((String) newValue);
				}
			}

		} else if (key.equals("value")) {
			if (visible) {
				int value = TiConvert.toInt(newValue);
				int thePos = (value - min) * incrementFactor;

				handler.obtainMessage(MSG_PROGRESS, thePos, -1).sendToTarget();
			}

		} else if (key.equals(TiC.PROPERTY_CANCELABLE)) {
			if (progressDialog != null) {
				progressDialog.setCancelable(TiConvert.toBoolean(newValue));
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

		// Don't try to show indicator if the root activity is not available
		if (!TiApplication.getInstance().isRootActivityAvailable()) {
			Activity currentActivity = TiApplication.getAppCurrentActivity();
			if (currentActivity instanceof TiLaunchActivity) {
				if (!((TiLaunchActivity) currentActivity).isJSActivity()) {
					return;
				}
			}
		}

		handleShow();
	}

	protected void handleShow()
	{
		String message = "";
		if (proxy.hasProperty("message")) {
			message = (String) proxy.getProperty("message");
		}

		location = DIALOG;
		if (proxy.hasProperty("location")) {
			location = TiConvert.toInt(proxy.getProperty("location"));
		}

		min = 0;
		if (proxy.hasProperty("min")) {
			min = TiConvert.toInt(proxy.getProperty("min"));
		}

		max = 100;
		if (proxy.hasProperty("max")) {
			max = TiConvert.toInt(proxy.getProperty("max"));
		}

		type = INDETERMINANT;
		if (proxy.hasProperty("type")) {
			type = TiConvert.toInt(proxy.getProperty("type"));
		}

		if (location == STATUS_BAR) {
			incrementFactor = 10000 / (max - min);
			Activity parent = (Activity) proxy.getActivity();

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
				Log.w(TAG, "Unknown activity indicator type: " + type);
			}
		} else if (location == DIALOG) {
			incrementFactor = 1;
			if (progressDialog == null) {
				Activity a = TiApplication.getInstance().getCurrentActivity();
				if (a == null) {
					a = TiApplication.getInstance().getRootActivity();
				}
				progressDialog = new ProgressDialog(a);
				if (a instanceof TiBaseActivity) {
					((TiBaseActivity) a).addDialog(progressDialog);
					progressDialog.setOwnerActivity(a);
				}
				progressDialog.setOnCancelListener(this);
			}

			progressDialog.setMessage(message);
			progressDialog.setCancelable(proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELABLE, false));

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
				Log.w(TAG, "Unknown activity indicator type: " + type);
			}
			progressDialog.show();
		} else {
			Log.w(TAG, "Unknown location property: " + location);
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
			Activity ownerActivity = progressDialog.getOwnerActivity();
			if (ownerActivity != null && !ownerActivity.isFinishing()) {
				((TiBaseActivity)ownerActivity).removeDialog(progressDialog);
				progressDialog.dismiss();
			}
			progressDialog = null;
		} else {
			Activity parent = (Activity) proxy.getActivity();
			parent.setProgressBarIndeterminate(false);
			parent.setProgressBarIndeterminateVisibility(false);
			parent.setProgressBarVisibility(false);
			parent.setTitle(statusBarTitle);
			statusBarTitle = null;
		}
		visible = false;
	}

	@Override
	public void onCancel(DialogInterface dialog) {
		visible = false;
		proxy.fireEvent(TiC.EVENT_CANCEL, null);
	}
}
