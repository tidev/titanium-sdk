/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.ref.WeakReference;

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

public class TiUIProgressIndicator
	extends TiUIView implements DialogInterface.OnCancelListener, DialogInterface.OnDismissListener
{
	private static final String TAG = "TiUIProgressDialog";

	public static final int INDETERMINANT = 0;
	public static final int DETERMINANT = 1;

	public static final int STATUS_BAR = 0;
	public static final int DIALOG = 1;

	protected boolean visible;
	protected ProgressDialog progressDialog;
	protected CharSequence statusBarTitle;
	protected int incrementFactor;
	protected int location;
	protected int min;
	protected int max;
	protected int type;

	public TiUIProgressIndicator(TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating an progress indicator", Log.DEBUG_MODE);
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

		if (key.equals(TiC.PROPERTY_MESSAGE)) {
			if (visible) {
				if (progressDialog != null) {
					progressDialog.setMessage((String) newValue);

				} else {
					Activity parent = (Activity) this.proxy.getActivity();
					parent.setTitle((String) newValue);
				}
			}

		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			if (visible) {
				int progressValue = (TiConvert.toInt(newValue, 0) - this.min) * this.incrementFactor;
				if (this.progressDialog != null) {
					this.progressDialog.setProgress(progressValue);
				} else {
					Activity activity = (Activity) this.proxy.getActivity();
					if (activity != null) {
						activity.setProgress(progressValue);
					}
				}
			}

		} else if (key.equals(TiC.PROPERTY_CANCELABLE)) {
			if (progressDialog != null) {
				progressDialog.setCancelable(TiConvert.toBoolean(newValue));
			}

		} else if (key.equals(TiC.PROPERTY_CANCELED_ON_TOUCH_OUTSIDE) && progressDialog != null) {
			progressDialog.setCanceledOnTouchOutside(TiConvert.toBoolean(newValue));
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
		if (proxy.hasProperty(TiC.PROPERTY_MESSAGE)) {
			message = (String) proxy.getProperty(TiC.PROPERTY_MESSAGE);
		}

		location = DIALOG;
		if (proxy.hasProperty(TiC.PROPERTY_LOCATION)) {
			location = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_LOCATION));
		}

		min = 0;
		if (proxy.hasProperty(TiC.PROPERTY_MIN)) {
			min = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_MIN));
		}

		max = 100;
		if (proxy.hasProperty(TiC.PROPERTY_MAX)) {
			max = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_MAX));
		}

		type = INDETERMINANT;
		if (proxy.hasProperty(TiC.PROPERTY_TYPE)) {
			type = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_TYPE));
		}

		int progressValue = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_VALUE), 0);

		if (location == STATUS_BAR) {
			incrementFactor = 10000 / (max - min);
			Activity parent = (Activity) proxy.getActivity();
			if ((parent == null) || parent.isFinishing() || parent.isDestroyed()) {
				Log.w(TAG, "Cannot show progress indicator in status bar. No activities are available to host it.");
				return;
			}
			if (type == INDETERMINANT) {
				parent.setProgressBarIndeterminate(true);
				parent.setProgressBarIndeterminateVisibility(true);
				statusBarTitle = parent.getTitle();
				parent.setTitle(message);
			} else if (type == DETERMINANT) {
				parent.setProgressBarIndeterminate(false);
				parent.setProgressBarIndeterminateVisibility(false);
				parent.setProgressBarVisibility(true);
				parent.setProgress((progressValue - this.min) * this.incrementFactor);
				statusBarTitle = parent.getTitle();
				parent.setTitle(message);
			} else {
				Log.w(TAG, "Unknown type: " + type);
				return;
			}
		} else if (location == DIALOG) {
			incrementFactor = 1;

			// If existing dialog references a destroyed activity, then drop reference to dialog.
			if (progressDialog != null) {
				Activity activity = progressDialog.getOwnerActivity();
				if ((activity == null) || activity.isFinishing() || activity.isDestroyed()) {
					progressDialog = null;
				}
			}

			// Create progress dialog if not done already.
			if (progressDialog == null) {
				Activity a = TiApplication.getInstance().getCurrentActivity();
				if ((a == null) || a.isFinishing() || a.isDestroyed()) {
					Log.w(TAG, "Cannot show progress indicator dialog. No activities are available to host it.");
					return;
				}
				progressDialog = new ProgressDialog(a);
				if (a instanceof TiBaseActivity) {
					TiBaseActivity baseActivity = (TiBaseActivity) a;
					baseActivity.addDialog(new TiBaseActivity.DialogWrapper(
						progressDialog, true, new WeakReference<TiBaseActivity>(baseActivity)));
					progressDialog.setOwnerActivity(a);
				}
				progressDialog.setOnCancelListener(this);
				progressDialog.setOnDismissListener(this);
			}

			// Set up dialog.
			// Note: We must call setCanceledOnTouchOutside() before setCancelable().
			progressDialog.setMessage(message);
			progressDialog.setCanceledOnTouchOutside(
				proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELED_ON_TOUCH_OUTSIDE, false));
			progressDialog.setCancelable(proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELABLE, false));
			if (type == INDETERMINANT) {
				progressDialog.setIndeterminate(true);
			} else if (type == DETERMINANT) {
				progressDialog.setIndeterminate(false);
				progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
				progressDialog.setMax(this.max - this.min);
			} else {
				Log.w(TAG, "Unknown type: " + type);
			}

			// Show the dialog.
			// Note: The setProgress() method only works after the dialog is shown.
			try {
				progressDialog.show();
				if (type == DETERMINANT) {
					progressDialog.setProgress(progressValue - this.min);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Failed to show progress indicator dialog.", ex);
				return;
			}
		} else {
			Log.w(TAG, "Unknown location: " + location);
			return;
		}

		// Flag progress indicator as shown.
		visible = true;
	}

	public void hide(KrollDict options)
	{
		handleHide();
	}

	protected void handleHide()
	{
		if (!this.visible) {
			return;
		}

		if (this.location == DIALOG) {
			if (this.progressDialog != null) {
				Activity ownerActivity = this.progressDialog.getOwnerActivity();
				if (ownerActivity instanceof TiBaseActivity) {
					((TiBaseActivity) ownerActivity).removeDialog(progressDialog);
					if (!ownerActivity.isFinishing() && !ownerActivity.isDestroyed()) {
						try {
							this.progressDialog.dismiss();
						} catch (Exception ex) {
							Log.e(TAG, "Failed to hide ProgressIndicator dialog.", ex);
						}
					}
				}
				this.progressDialog = null;
			}
		} else if (this.location == STATUS_BAR) {
			Activity parent = proxy.getActivity();
			if (parent != null) {
				parent.setProgressBarIndeterminate(false);
				parent.setProgressBarIndeterminateVisibility(false);
				parent.setProgressBarVisibility(false);
				if (this.visible) {
					parent.setTitle(this.statusBarTitle);
				}
			}
			this.statusBarTitle = null;
		}

		this.visible = false;
	}

	@Override
	public void onCancel(DialogInterface dialog)
	{
		this.visible = false;
		this.progressDialog = null;
		fireEvent(TiC.EVENT_CANCEL, null);
	}

	@Override
	public void onDismiss(DialogInterface dialog)
	{
		this.visible = false;
		this.progressDialog = null;
	}
}
