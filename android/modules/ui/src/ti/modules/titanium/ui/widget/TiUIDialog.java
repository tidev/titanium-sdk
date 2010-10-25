/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.AlertDialog.Builder;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;

public class TiUIDialog extends TiUIView
{
	private static final String LCAT = "TiUIDialog";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int BUTTON_MASK = 0x10000000;

	protected Builder builder;
	protected AlertDialog dialog;
	protected TiUIView view;

	protected class ClickHandler implements DialogInterface.OnClickListener {

		private int result;

		public ClickHandler(int id) {
			this.result = id;
		}
		public void onClick(DialogInterface dialog, int which) {
			handleEvent(result);
			hide(null);
		}
	}

	public TiUIDialog(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a dialog");
		}
	}

	private Activity getCurrentActivity() {
		Activity currentActivity = proxy.getTiContext().getTiApp().getCurrentActivity();
		if (currentActivity == null) {
			currentActivity = proxy.getTiContext().getActivity();
		}
		return currentActivity;
	}
	
	@Override
	public void processProperties(TiDict d)
	{
		if (builder == null) {
			return;
		}
		if (d.containsKey("title")) {
			builder.setTitle(d.getString("title"));
		}
		if (d.containsKey("message")) {
			builder.setMessage(d.getString("message"));
		}
		if (d.containsKey("buttonNames"))
		{
			String[] buttonText = d.getStringArray("buttonNames");
			processButtons(buttonText);
		}
		if (d.containsKey("androidView")) {
			processView((TiViewProxy) proxy.getDynamicValue("androidView"));
		} else if (d.containsKey("options")) {
			String[] optionText = d.getStringArray("options");
			processOptions(optionText);
		}

		super.processProperties(d);
	}

	private void processOptions(String[] optionText) {
		builder.setSingleChoiceItems(optionText, -1 , new DialogInterface.OnClickListener() {

			public void onClick(DialogInterface dialog, int which) {
				handleEvent(which);
				dialog.dismiss();
			}});
	}

	private void processButtons(String[] buttonText)
	{
		builder.setPositiveButton(null, null);
		builder.setNegativeButton(null, null);
		builder.setNeutralButton(null, null);

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
				Log.e(LCAT, "Only 3 buttons are supported");
			}
		}
	}

	private void processView(TiViewProxy proxy) {
		view = proxy.getView(getCurrentActivity());
		builder.setView(view.getNativeView());
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}

		if (key.equals("title")) {
			if (dialog != null) {
				dialog.setTitle((String) newValue);
			}
		} else if (key.equals("message")) {
			if (dialog != null) {
				dialog.setMessage((String) newValue);
			}
		} else if (key.equals("buttonNames")) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}

			processButtons(TiConvert.toStringArray((Object[]) newValue));
		} else if (key.equals("options")) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}

			builder.setView(null);
			processOptions(TiConvert.toStringArray((Object[]) newValue));
		} else if (key.equals("androidView")) {
			if (dialog != null) {
				dialog.dismiss();
				dialog = null;
			}
			processView((TiViewProxy) newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void show(TiDict options)
	{
		if (dialog == null) {
			Activity currentActivity = getCurrentActivity();
			
			this.builder = new AlertDialog.Builder(currentActivity);
			this.builder.setCancelable(true);

			processProperties(proxy.getDynamicProperties());
			builder.setOnCancelListener(new OnCancelListener() {
				
				@Override
				public void onCancel(DialogInterface dlg) {
					int cancelIndex = (proxy.hasDynamicValue("cancel")) ? TiConvert.toInt(proxy.getDynamicValue("cancel")) : -1;
					if (DBG) {
						Log.d(LCAT, "onCancelListener called. Sending index: " + cancelIndex);
					}
					handleEvent(cancelIndex);
					hide(null);
				}
			});
			dialog = builder.create();
			builder = null;
		}
		try {
			dialog.show();
		} catch (Throwable t) {
			Log.w(LCAT, "Window must have gone away.");
		}
	}

	public void hide(TiDict options)
	{
		if (dialog != null) {
			dialog.dismiss();
			dialog = null;
		}
		if (view != null) {
			view.getProxy().releaseViews();
			view = null;
		}
	}

	public void handleEvent(int id)
	{
		int cancelIndex = (proxy.hasDynamicValue("cancel")) ? TiConvert.toInt(proxy.getDynamicValue("cancel")) : -1;
		TiDict data = new TiDict();
		if ((id & BUTTON_MASK) != 0) {
			data.put("button", true);
			id &= ~BUTTON_MASK;
		} else {
			data.put("button", false);
		}
		data.put("index", id);
		data.put("cancel", id == cancelIndex);
		proxy.fireEvent("click", data);
	}
}
