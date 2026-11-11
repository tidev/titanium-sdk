/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.DialogInterface;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import androidx.appcompat.app.AlertDialog;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.textview.MaterialTextView;

public class TiUIProgressIndicator extends TiUIView implements
	DialogInterface.OnShowListener, DialogInterface.OnCancelListener, DialogInterface.OnDismissListener
{
	private static final String TAG = "TiUIProgressDialog";

	public static final int INDETERMINANT = 0;
	public static final int DETERMINANT = 1;

	public static final int STATUS_BAR = 0;
	public static final int DIALOG = 1;

	private static final int DIALOG_PADDING_DP = 24;
	private static final int DIALOG_SPACING_DP = 16;

	protected boolean visible;
	protected AlertDialog progressDialog;
	private MaterialTextView messageView;
	private LinearProgressIndicator linearIndicator;
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
					if (messageView != null) {
						messageView.setText(TiConvert.toString(newValue));
					}
				} else {
					Activity parent = (Activity) this.proxy.getActivity();
					parent.setTitle((String) newValue);
				}
			}

		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			if (visible) {
				int progressValue = (TiConvert.toInt(newValue, 0) - this.min) * this.incrementFactor;
				if (this.progressDialog != null) {
					if (this.linearIndicator != null) {
						this.linearIndicator.setProgressCompat(progressValue, true);
					}
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
				if (type != INDETERMINANT && type != DETERMINANT) {
					Log.w(TAG, "Unknown type: " + type);
				}
				progressDialog = new MaterialAlertDialogBuilder(a).setView(createDialogContentView(a)).create();
				if (a instanceof TiBaseActivity) {
					TiBaseActivity baseActivity = (TiBaseActivity) a;
					baseActivity.addDialog(new TiBaseActivity.DialogWrapper(
						progressDialog, true, new WeakReference<>(baseActivity)));
					progressDialog.setOwnerActivity(a);
				}
				progressDialog.setOnShowListener(this);
				progressDialog.setOnCancelListener(this);
				progressDialog.setOnDismissListener(this);
			}

			// Set up dialog.
			// Note: We must call setCanceledOnTouchOutside() before setCancelable().
			messageView.setText(message);
			progressDialog.setCanceledOnTouchOutside(
				proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELED_ON_TOUCH_OUTSIDE, false));
			progressDialog.setCancelable(proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELABLE, false));
			if (linearIndicator != null) {
				linearIndicator.setMax(this.max - this.min);
				linearIndicator.setProgressCompat(progressValue - this.min, false);
			}

			// Show the dialog.
			try {
				progressDialog.show();
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

	/**
	 * Creates the content view of the progress dialog.
	 * The indeterminate type shows a circular indicator next to the message.
	 * The determinate type shows the message above a horizontal progress bar.
	 */
	private LinearLayout createDialogContentView(Activity activity)
	{
		int padding = (int) TiUIHelper.getRawDIPSize(DIALOG_PADDING_DP, activity);
		int spacing = (int) TiUIHelper.getRawDIPSize(DIALOG_SPACING_DP, activity);

		LinearLayout layout = new LinearLayout(activity);
		layout.setPadding(padding, padding, padding, padding);

		this.messageView = new MaterialTextView(activity);
		this.messageView.setTextAppearance(com.google.android.material.R.style.TextAppearance_Material3_BodyMedium);
		this.linearIndicator = null;

		if (type == DETERMINANT) {
			layout.setOrientation(LinearLayout.VERTICAL);
			layout.addView(this.messageView, new LinearLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

			this.linearIndicator = new LinearProgressIndicator(activity);
			this.linearIndicator.setIndeterminate(false);
			LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
			params.topMargin = spacing;
			layout.addView(this.linearIndicator, params);
		} else {
			layout.setOrientation(LinearLayout.HORIZONTAL);
			layout.setGravity(Gravity.CENTER_VERTICAL);

			CircularProgressIndicator circularIndicator = new CircularProgressIndicator(activity);
			circularIndicator.setIndeterminate(true);
			layout.addView(circularIndicator, new LinearLayout.LayoutParams(
				ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

			LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
				0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
			params.setMarginStart(padding);
			layout.addView(this.messageView, params);
		}
		return layout;
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
				this.messageView = null;
				this.linearIndicator = null;
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
	public void onShow(DialogInterface dialog)
	{
	}

	@Override
	public void onCancel(DialogInterface dialog)
	{
		if (dialog != this.progressDialog) {
			return;
		}

		this.visible = false;
		this.progressDialog = null;
		this.messageView = null;
		this.linearIndicator = null;
		fireEvent(TiC.EVENT_CANCEL, null);
	}

	@Override
	public void onDismiss(DialogInterface dialog)
	{
		if (dialog != this.progressDialog) {
			return;
		}

		this.visible = false;
		this.progressDialog = null;
		this.messageView = null;
		this.linearIndicator = null;
	}
}
