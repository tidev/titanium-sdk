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
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.AlertDialog.Builder;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;

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
		public ClickHandler(int id) {
			this.result = id;
		}
		public void onClick(DialogInterface dialog, int which) {
			handleEvent(result);
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
			getBuilder().setTitle(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_MESSAGE)) {
			getBuilder().setMessage(d.getString(TiC.PROPERTY_MESSAGE));
		}
		if (d.containsKey(TiC.PROPERTY_BUTTON_NAMES))
		{
			buttonText = d.getStringArray(TiC.PROPERTY_BUTTON_NAMES);
		} else if (d.containsKey(TiC.PROPERTY_OK)) {
			buttonText = new String[]{d.getString(TiC.PROPERTY_OK)};
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_ANDROID_VIEW)) {
			processView((TiViewProxy) proxy.getProperty(TiC.PROPERTY_ANDROID_VIEW));
		} else if (d.containsKey(TiC.PROPERTY_OPTIONS)) {
			String[] optionText = d.getStringArray(TiC.PROPERTY_OPTIONS);
			int selectedIndex = d.containsKey(TiC.PROPERTY_SELECTED_INDEX) ? d.getInt(TiC.PROPERTY_SELECTED_INDEX) : -1; 
			if(selectedIndex >= optionText.length){
				Log.d(TAG, "Ooops invalid selected index specified: " + selectedIndex, Log.DEBUG_MODE);
				selectedIndex = -1;
			}
			
			processOptions(optionText, selectedIndex);
		}
		
		if (d.containsKey(TiC.PROPERTY_PERSISTENT)) {
			dialogWrapper.setPersistent(d.getBoolean(TiC.PROPERTY_PERSISTENT));
		}

		if (buttonText != null) {
			processButtons(buttonText);
		}
		super.processProperties(d);
	}

	private void processOptions(String[] optionText,int selectedIndex)
	{
		getBuilder().setSingleChoiceItems(optionText, selectedIndex , new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				handleEvent(which);
				hide(null);
			}
		});
	}

	private void processButtons(String[] buttonText)
	{
		getBuilder().setPositiveButton(null, null);
		getBuilder().setNegativeButton(null, null);
		getBuilder().setNeutralButton(null, null);
		getBuilder().setOnCancelListener(new OnCancelListener() {
			@Override
			public void onCancel(DialogInterface dialog)
			{
				dialog = null;
				if (view != null)
				{
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
				getBuilder().setPositiveButton(text, clicker);
				break;
			case 1:
				getBuilder().setNeutralButton(text, clicker);
				break;
			case 2:
				getBuilder().setNegativeButton(text, clicker);
				break;
			default:
				Log.e(TAG, "Only 3 buttons are supported");
			}
		}
	}

	private void processView(TiViewProxy proxy)
	{
		if (proxy != null) {
			view = proxy.getOrCreateView();
			getBuilder().setView(view.getNativeView());
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);

		AlertDialog dialog = dialogWrapper.getDialog();
		if (key.equals(TiC.PROPERTY_TITLE)) {
			if (dialog != null) {
				dialog.setTitle((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_MESSAGE)) {
			if (dialog != null) {
				dialog.setMessage((String) newValue);
			}
		} else if (key.equals(TiC.PROPERTY_BUTTON_NAMES)) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}
			processButtons(TiConvert.toStringArray((Object[]) newValue));
		} else if (key.equals(TiC.PROPERTY_OK) && !proxy.hasProperty(TiC.PROPERTY_BUTTON_NAMES)) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}
			processButtons(new String[]{TiConvert.toString(newValue)});
		} else if (key.equals(TiC.PROPERTY_OPTIONS)) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}

			getBuilder().setView(null);
			int selectedIndex = -1;
			if (proxy.hasProperty(TiC.PROPERTY_SELECTED_INDEX)) {
				selectedIndex = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_SELECTED_INDEX));
			}
			processOptions(TiConvert.toStringArray((Object[]) newValue), selectedIndex);
		} else if (key.equals(TiC.PROPERTY_SELECTED_INDEX)) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}
			
			getBuilder().setView(null);
			if (proxy.hasProperty(TiC.PROPERTY_OPTIONS)) {
				processOptions(TiConvert.toStringArray((Object[]) proxy.getProperty(TiC.PROPERTY_OPTIONS)), TiConvert.toInt(newValue));

			}
		} else if (key.equals(TiC.PROPERTY_ANDROID_VIEW)) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}
			if (newValue != null) {
				processView((TiViewProxy) newValue);
			} else {
				proxy.setProperty(TiC.PROPERTY_ANDROID_VIEW, null, false);
			}
		} else if (key.equals(TiC.PROPERTY_PERSISTENT) && newValue != null) {
			dialogWrapper.setPersistent(TiConvert.toBoolean(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void show(KrollDict options)
	{
		AlertDialog dialog = dialogWrapper.getDialog();
		if (dialog == null) {
			processProperties(proxy.getProperties());
			getBuilder().setOnCancelListener(new OnCancelListener() {
				@Override
				public void onCancel(DialogInterface dlg) {
					int cancelIndex = (proxy.hasProperty(TiC.PROPERTY_CANCEL)) ? TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_CANCEL)) : -1;
					Log.d(TAG, "onCancelListener called. Sending index: " + cancelIndex, Log.DEBUG_MODE);
					handleEvent(cancelIndex);
					hide(null);
				}
			});
			dialog = getBuilder().create();
			dialogWrapper.setDialog(dialog);
			builder = null;
		}
		try {
			Activity dialogActivity = dialogWrapper.getActivity();
			if (dialogActivity != null && !dialogActivity.isFinishing()) {
				if (dialogActivity instanceof TiBaseActivity) {
					//add dialog to its activity so we can clean it up later to prevent memory leak.
					((TiBaseActivity) dialogActivity).addDialog(dialogWrapper);
					dialog.show();
				}
			} else {
				dialog = null;
				Log.w(TAG, "Dialog activity is destroyed, unable to show dialog with message: " + TiConvert.toString(proxy.getProperty(TiC.PROPERTY_MESSAGE)));
			}
		} catch (Throwable t) {
			Log.w(TAG, "Context must have gone away: " + t.getMessage(), t);
		}
	}

	public void hide(KrollDict options)
	{
		AlertDialog dialog = dialogWrapper.getDialog();
		if (dialog != null) {
			dialog.dismiss();
			dialogWrapper.getActivity().removeDialog(dialog);
		}

		if (view != null) {
			view.getProxy().releaseViews();
			view = null;
		}
	}

	private void createBuilder()
	{
		Activity currentActivity = getCurrentActivity();
		if (currentActivity != null) {
			this.builder = new AlertDialog.Builder(currentActivity);
			this.builder.setCancelable(true);
			
			//Native dialogs are persistent by default.
			TiBaseActivity dialogActivity = (TiBaseActivity)currentActivity;
			dialogWrapper = dialogActivity.new DialogWrapper(null, true, new WeakReference<TiBaseActivity>(dialogActivity));
		} else {
			Log.e (TAG, "Unable to find an activity for dialog.");
		}
	}

	public void handleEvent(int id)
	{
		int cancelIndex = (proxy.hasProperty(TiC.PROPERTY_CANCEL)) ?
			TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_CANCEL)) : -1;
		KrollDict data = new KrollDict();
		if ((id & BUTTON_MASK) != 0) {
			data.put(TiC.PROPERTY_BUTTON, true);
			id &= ~BUTTON_MASK;
		} else {
			data.put(TiC.PROPERTY_BUTTON, false);
			// If an option was selected and the user accepted it, update the proxy.
			if (proxy.hasProperty(TiC.PROPERTY_OPTIONS)) {
				proxy.setProperty(TiC.PROPERTY_SELECTED_INDEX, id, false);
			}
		}
		data.put(TiC.EVENT_PROPERTY_INDEX, id);
		data.put(TiC.PROPERTY_CANCEL, id == cancelIndex);
		proxy.fireEvent(TiC.EVENT_CLICK, data);
	}
}
