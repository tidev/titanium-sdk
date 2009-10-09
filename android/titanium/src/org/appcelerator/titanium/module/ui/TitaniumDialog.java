/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;


import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import android.app.AlertDialog;
import android.content.DialogInterface;

public class TitaniumDialog implements ITitaniumDialog
{
	private static final String LCAT = "TiDialog";
	private static boolean DBG = TitaniumConfig.LOGD;

	public static final String CLICK_EVENT = "click";

	protected TitaniumModuleManager tmm;
	protected AlertDialog.Builder builder;
	protected TitaniumJSEventManager eventListeners;

	protected class ClickHandler implements DialogInterface.OnClickListener {

		private int result;

		public ClickHandler(int id) {
			this.result = id;
		}
		public void onClick(DialogInterface dialog, int which) {
			handleEvent(result);
			dialog.dismiss();
		}
	}
	public TitaniumDialog(TitaniumModuleManager tmm)
	{
		this.tmm = tmm;
		this.eventListeners = new TitaniumJSEventManager(tmm);
		this.eventListeners.supportEvent(CLICK_EVENT);
		this.builder = new AlertDialog.Builder(tmm.getActivity());
		this.builder.setCancelable(true);
	}

	public void setMessage(String msg) {
		builder.setMessage(msg);
	}

	public void setTitle(String title) {
		builder.setTitle(title);
	}

	public int addEventListener(String eventName, String listener) {
		if(eventName == null || !eventName.toLowerCase().equals(CLICK_EVENT)) {
			throw new IllegalStateException("TitaniumDialog only handles listeners named: " + CLICK_EVENT);
		}

		return eventListeners.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		if(eventName == null || !eventName.toLowerCase().equals(CLICK_EVENT)) {
			throw new IllegalStateException("TitaniumDialog only handles listeners named: " + CLICK_EVENT);
		}

		eventListeners.removeListener(eventName, listenerId);
	}

	public void setButtons(String[] buttonText)
	{
		builder.setPositiveButton(null, null);
		builder.setNegativeButton(null, null);
		builder.setNeutralButton(null, null);

		for (int id = 0; id < buttonText.length; id++) {
			String text = buttonText[id];
			ClickHandler clicker = new ClickHandler(id);
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

	public void setOptions(String[] optionText) {
		if (DBG) {
			Log.d(LCAT, "Option Text length: " + optionText.length);
			for (String t : optionText) {
				Log.d(LCAT, "Option: " + t);
			}
		}
		builder.setSingleChoiceItems(optionText, -1 , new DialogInterface.OnClickListener() {

			public void onClick(DialogInterface dialog, int which) {
				handleEvent(which);
				dialog.dismiss();
			}});
	}

	protected void handleEvent(int id) {
		eventListeners.invokeSuccessListeners(CLICK_EVENT, "{ type : '" + CLICK_EVENT + "', index : " + id + " }");
	}

	public void show() {
		TitaniumActivity activity = tmm.getActivity();
		if (activity != null) {
			activity.runOnUiThreadWithCheck(new TitaniumActivity.CheckedRunnable(){

				public void run(boolean isUISafe) {
					if (isUISafe) {
						builder.create().show();
					} else {
						Log.w(LCAT, "Attempt to show dialog ignored, UI is not available.");
					}
				}});
		}
	}
}
