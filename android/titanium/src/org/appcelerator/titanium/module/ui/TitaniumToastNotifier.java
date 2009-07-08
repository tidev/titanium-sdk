/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.ui;



import android.os.Handler;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.config.TitaniumConfig;
import android.view.View;
import android.widget.Toast;

public class TitaniumToastNotifier extends TitaniumNotifier
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiToastNotifier";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected Toast toast;

	public TitaniumToastNotifier(Handler handler, TitaniumActivity activity) {
		super(handler, activity);
	}

	private int getToastDelay() {
		return getDelay() > 0 ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT;
	}
	@Override
	public void show(boolean animate, boolean autohide)
	{
		final TitaniumActivity activity = getActivity().get();
		if (activity != null) {
			if (toast == null) {
				toast = Toast.makeText(activity, getMessage(), getToastDelay());
			} else {
				toast.setText(getMessage());
				toast.setDuration(getToastDelay());
			}
		}

		if (activity != null) {
			activity.runOnUiThread(new Runnable()
			{
				public void run()
				{
					toast.show();
				}
			});
		}
	}

	public void hide(boolean animate) {
		if (toast != null && showing) {
			TitaniumActivity activity = getActivity().get();
			if (activity != null) {
				activity.runOnUiThread(new Runnable(){

					public void run() {
						toast.cancel();
					}
				});
			}
		}
	}
}
