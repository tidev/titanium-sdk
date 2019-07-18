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
import org.appcelerator.titanium.TiBaseActivity.DialogWrapper;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiBorderWrapperView;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AlertDialog.Builder;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;
import android.support.v4.view.ViewCompat;
import android.view.ViewParent;
import android.widget.ListView;

public class TiUIDialog extends TiUIView
{
	private static final String TAG = "TiUIDialog";
	private static final int BUTTON_MASK = 0x10000000;

	protected Builder builder;
	protected TiUIView view;
	private DialogWrapper dialogWrapper;

	protected class ClickHandler implements DialogInterface.OnClickListener
	{
		private int result;
		public ClickHandler(int id)
		{
			this.result = id;
		}
		public void onClick(DialogInterface dialog, int which)
		{
			handleEvent(result, true);
			hide(null);
		}
	}

	public TiUIDialog(TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a dialog", Log.DEBUG_MODE);
		createBuilder();
	}

	private Activity getCurrentActivity()
	{
		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();
		if (currentActivity == null) {
			currentActivity = proxy.getActivity();
		}
		return currentActivity;
	}

	private Builder getBuilder()
	{
		if (builder == null) {
			createBuilder();
		}
		return builder;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		String[] buttonText = null;
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			Builder builder = getBuilder();
			if (builder != null) {
				builder.setTitle(d.getString(TiC.PROPERTY_TITLE));
			}
		}
		if (d.containsKey(TiC.PROPERTY_MESSAGE)) {
			Builder builder = getBuilder();
			if (builder != null) {
				builder.setMessage(d.getString(TiC.PROPERTY_MESSAGE));
			}
		}
		if (d.containsKey(TiC.PROPERTY_BUTTON_NAMES)) {
			buttonText = d.getStringArray(TiC.PROPERTY_BUTTON_NAMES);
		} else if (d.containsKey(TiC.PROPERTY_OK)) {
			buttonText = new String[] { d.getString(TiC.PROPERTY_OK) };
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_ANDROID_VIEW)) {
			processView((TiViewProxy) proxy.getProperty(TiC.PROPERTY_ANDROID_VIEW));
		} else if (d.containsKey(TiC.PROPERTY_OPTIONS)) {
			String[] optionText = d.getStringArray(TiC.PROPERTY_OPTIONS);
			int selectedIndex = d.containsKey(TiC.PROPERTY_SELECTED_INDEX) ? d.getInt(TiC.PROPERTY_SELECTED_INDEX) : -1;
			if (selectedIndex >= optionText.length) {
				Log.d(TAG, "Ooops invalid selected index specified: " + selectedIndex, Log.DEBUG_MODE);
				selectedIndex = -1;
			}

			processOptions(optionText, selectedIndex);
		}

		if (d.containsKey(TiC.PROPERTY_PERSISTENT)) {
			if (this.dialogWrapper != null) {
				this.dialogWrapper.setPersistent(d.getBoolean(TiC.PROPERTY_PERSISTENT));
			}
		}

		if (buttonText != null) {
			processButtons(buttonText);
		}
		super.processProperties(d);
	}

	private void processOptions(String[] optionText, int selectedIndex)
	{
		Builder builder = getBuilder();
		if (builder == null) {
			return;
		}

		if (selectedIndex != -1) {
			builder.setSingleChoiceItems(optionText, selectedIndex, new DialogInterface.OnClickListener() {
				@Override
				public void onClick(DialogInterface dialog, int which)
				{
					handleEvent(which, true);
					hide(null);
				}
			});
		} else {
			builder.setItems(optionText, new DialogInterface.OnClickListener() {
				@Override
				public void onClick(DialogInterface dialog, int which)
				{
					handleEvent(which, false);
					hide(null);
				}
			});
		}
	}

	private void processButtons(String[] buttonText)
	{
		Builder builder = getBuilder();
		if (builder == null) {
			return;
		}

		builder.setPositiveButton(null, null);
		builder.setNegativeButton(null, null);
		builder.setNeutralButton(null, null);
		builder.setOnCancelListener(new OnCancelListener() {
			@Override
			public void onCancel(DialogInterface dialog)
			{
				dialog = null;
				if (view != null) {
					view.getProxy().releaseViews();
					view = null;
				}
			}
		});

		for (int id = 0; id < buttonText.length; id++) {
			String text = buttonText[id];
			ClickHandler clicker = new ClickHandler(id | BUTTON_MASK);
			switch (id) {
				case 0:
					builder.setPositiveButton(text, clicker);
					break;
				case 1:
					builder.setNeutralButton(text, clicker);
					break;
				case 2:
					builder.setNegativeButton(text, clicker);
					break;
				default:
					Log.e(TAG, "Only 3 buttons are supported");
			}
		}
	}

	private void processView(TiViewProxy proxy)
	{
		// Validate.
		if ((proxy == null) || (this.dialogWrapper == null)) {
			return;
		}

		// Reset the child view context to parent context.
		proxy.setActivity(this.dialogWrapper.getActivity());
		view = proxy.getOrCreateView();

		// Handle view border.
		Builder builder = getBuilder();
		if ((builder != null) && (view != null)) {
			ViewParent viewParent = view.getNativeView().getParent();
			if (viewParent != null) {
				if (viewParent instanceof TiBorderWrapperView) {
					builder.setView((TiBorderWrapperView) viewParent);
				} else {
					Log.w(TAG, "could not set androidView, unsupported object: " + proxy.getClass().getSimpleName());
				}
			} else {
				builder.setView(view.getNativeView());
			}
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);

		AlertDialog dialog = null;
		if ((this.dialogWrapper != null) && (this.dialogWrapper.getDialog() != null)) {
			dialog = (AlertDialog) this.dialogWrapper.getDialog();
		}

		if (key.equals(TiC.PROPERTY_TITLE)) {
			if (dialog != null) {
				dialog.setTitle((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_MESSAGE)) {
			if (dialog != null) {
				dialog.setMessage((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_BUTTON_NAMES)) {
			dismissDialog();
			processButtons(TiConvert.toStringArray((Object[]) newValue));
		} else if (key.equals(TiC.PROPERTY_OK) && !proxy.hasProperty(TiC.PROPERTY_BUTTON_NAMES)) {
			dismissDialog();
			processButtons(new String[] { TiConvert.toString(newValue) });
		} else if (key.equals(TiC.PROPERTY_OPTIONS)) {
			dismissDialog();
			Builder builder = getBuilder();
			if (builder != null) {
				builder.setView(null);
			}
			int selectedIndex = -1;
			if (proxy.hasProperty(TiC.PROPERTY_SELECTED_INDEX)) {
				selectedIndex = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_SELECTED_INDEX));
			}
			processOptions(TiConvert.toStringArray((Object[]) newValue), selectedIndex);
		} else if (key.equals(TiC.PROPERTY_SELECTED_INDEX)) {
			dismissDialog();
			Builder builder = getBuilder();
			if (builder != null) {
				builder.setView(null);
			}
			if (proxy.hasProperty(TiC.PROPERTY_OPTIONS)) {
				processOptions(TiConvert.toStringArray((Object[]) proxy.getProperty(TiC.PROPERTY_OPTIONS)),
							   TiConvert.toInt(newValue));
			}
		} else if (key.equals(TiC.PROPERTY_ANDROID_VIEW)) {
			dismissDialog();
			if (newValue != null) {
				processView((TiViewProxy) newValue);
			} else {
				proxy.setProperty(TiC.PROPERTY_ANDROID_VIEW, null);
			}
		} else if (key.equals(TiC.PROPERTY_PERSISTENT) && newValue != null) {
			if (this.dialogWrapper != null) {
				dialogWrapper.setPersistent(TiConvert.toBoolean(newValue));
			}
		} else if (key.indexOf("accessibility") == 0) {
			if (dialog != null) {
				ListView listView = dialog.getListView();
				if (listView != null) {
					if (key.equals(TiC.PROPERTY_ACCESSIBILITY_HIDDEN)) {
						int importance = ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_AUTO;
						if (newValue != null && TiConvert.toBoolean(newValue)) {
							importance = ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO;
						}
						ViewCompat.setImportantForAccessibility(listView, importance);
					} else {
						listView.setContentDescription(getProxy().composeContentDescription());
					}
				}
			}
		} else if (key.equals(TiC.PROPERTY_CANCELED_ON_TOUCH_OUTSIDE) && dialog != null) {
			dialog.setCanceledOnTouchOutside(TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void show(KrollDict options)
	{
		if (this.dialogWrapper == null) {
			return;
		}

		Builder builder = getBuilder();
		if (builder == null) {
			return;
		}

		AlertDialog dialog = (AlertDialog) dialogWrapper.getDialog();
		if (dialog == null) {
			if (dialogWrapper.getActivity() == null) {
				TiBaseActivity dialogActivity = (TiBaseActivity) getCurrentActivity();
				dialogWrapper.setActivity(new WeakReference<TiBaseActivity>(dialogActivity));
			}
			processProperties(proxy.getProperties());
			builder.setOnCancelListener(new OnCancelListener() {
				@Override
				public void onCancel(DialogInterface dlg)
				{
					int cancelIndex = (proxy.hasProperty(TiC.PROPERTY_CANCEL))
										  ? TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_CANCEL))
										  : -1;
					Log.d(TAG, "onCancelListener called. Sending index: " + cancelIndex, Log.DEBUG_MODE);
					// In case wew cancel the Dialog we should not overwrite the selectedIndex
					handleEvent(cancelIndex, false);
					hide(null);
				}
			});
			dialog = builder.create();
			dialog.setCanceledOnTouchOutside(
				proxy.getProperties().optBoolean(TiC.PROPERTY_CANCELED_ON_TOUCH_OUTSIDE, true));
			dialog.setCancelable(!proxy.getProperties().optBoolean(TiC.PROPERTY_BUTTON_CLICK_REQUIRED, false));
			// Initially apply accessibility properties here, the first time
			// the dialog actually becomes available. After this, propertyChanged
			// can also be used.
			ListView listView = dialog.getListView();
			if (listView != null) {
				int importance = ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_AUTO;
				if (proxy != null) {
					listView.setContentDescription(proxy.composeContentDescription());
					Object propertyValue = proxy.getProperty(TiC.PROPERTY_ACCESSIBILITY_HIDDEN);
					if (propertyValue != null && TiConvert.toBoolean(propertyValue)) {
						importance = ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO;
					}
				}
				ViewCompat.setImportantForAccessibility(listView, importance);
			}

			dialogWrapper.setDialog(dialog);
			builder = null;
		}

		try {
			Activity dialogActivity = dialogWrapper.getActivity();
			if (dialogActivity != null && !dialogActivity.isFinishing() && !dialogActivity.isDestroyed()) {
				if (dialogActivity instanceof TiBaseActivity) {
					//add dialog to its activity so we can clean it up later to prevent memory leak.
					((TiBaseActivity) dialogActivity).addDialog(dialogWrapper);
					dialog.show();
				}
			} else {
				dialog = null;
				Log.w(TAG, "Dialog activity is destroyed, unable to show dialog with message: "
							   + TiConvert.toString(proxy.getProperty(TiC.PROPERTY_MESSAGE)));
			}
		} catch (Throwable t) {
			Log.w(TAG, "Context must have gone away: " + t.getMessage(), t);
		}
	}

	public void hide(KrollDict options)
	{
		dismissDialog();
		if (this.view != null) {
			TiViewProxy proxy = this.view.getProxy();
			if (proxy != null) {
				proxy.releaseViews();
			}
			this.view = null;
		}
	}

	private void dismissDialog()
	{
		// Validate.
		if (this.dialogWrapper == null) {
			return;
		}

		// Fetch the activity that is hosting the dialog.
		TiBaseActivity activity = this.dialogWrapper.getActivity();
		if (activity == null) {
			return;
		}

		// Fetch the dialog. Will be null if never created/shown.
		AlertDialog dialog = (AlertDialog) this.dialogWrapper.getDialog();
		if (dialog == null) {
			return;
		}

		// Don't let the activity remove the dialog in its onStop/onDestroy since we'll be doing it below.
		activity.removeDialog(dialog);

		// Dismiss the dialog.
		// Note: Will throw an exception if the hosting activity is destroyed or about to be destroyed.
		//       If "Do not keep activities" is enabled, then isFinishing() will return false for destroyed activity.
		boolean wasDismissed = false;
		try {
			if (!activity.isFinishing() && !activity.isDestroyed()) {
				dialog.dismiss();
				wasDismissed = true;
			}
		} catch (Exception ex) {
			Log.e(TAG, "Failed to hide AlertDialog.", ex);
		}

		// If we were not able to dismiss the dialog above, then assume its hosting activity was destroyed.
		// We need to null out the activity assigned to the dialog so that it can be re-used later.
		if (!wasDismissed) {
			this.dialogWrapper.setActivity(null);
		}
	}

	private void createBuilder()
	{
		Activity currentActivity = getCurrentActivity();
		if (currentActivity != null) {
			this.builder = new AlertDialog.Builder(currentActivity);
			this.builder.setCancelable(true);

			//Native dialogs are persistent by default.
			TiBaseActivity dialogActivity = (TiBaseActivity) currentActivity;
			dialogWrapper =
				new TiBaseActivity.DialogWrapper(null, true, new WeakReference<TiBaseActivity>(dialogActivity));
		} else {
			Log.e(TAG, "Unable to find an activity for dialog.");
		}
	}

	public void handleEvent(int id, boolean saveSelectedIndex)
	{
		int cancelIndex =
			(proxy.hasProperty(TiC.PROPERTY_CANCEL)) ? TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_CANCEL)) : -1;
		KrollDict data = new KrollDict();

		// TIMOB-18500 Android: event.cancel not set properly for optionsDialog
		boolean isCancel = id == cancelIndex;
		if (!isCancel) {
			if ((id & BUTTON_MASK) != 0) {
				data.put(TiC.PROPERTY_BUTTON, true);
				id &= ~BUTTON_MASK;
			} else {
				data.put(TiC.PROPERTY_BUTTON, false);
				// If an option was selected, the user accepted and we are showing radio buttons, update the proxy.
				if (proxy.hasProperty(TiC.PROPERTY_OPTIONS) && saveSelectedIndex) {
					proxy.setProperty(TiC.PROPERTY_SELECTED_INDEX, id);
				}
			}
		}
		data.put(TiC.EVENT_PROPERTY_INDEX, id);
		data.put(TiC.PROPERTY_CANCEL, isCancel);
		if (isCancel) {
			fireEvent(TiC.EVENT_CANCEL, data);
		}
		fireEvent(TiC.EVENT_CLICK, data);
	}
}
