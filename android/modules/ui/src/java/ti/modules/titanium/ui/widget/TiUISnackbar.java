/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.view.View;

import com.google.android.material.snackbar.Snackbar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

public class TiUISnackbar extends TiUIView
{
	private static final String TAG = "TiUISnackbar";

	public TiUISnackbar(TiViewProxy proxy)
	{
		super(proxy);
	}

	public void showMessage()
	{
		View view = this.parent.getOrCreateView().getNativeView();

		String message = "";
		if (proxy.hasProperty(TiC.PROPERTY_MESSAGE)) {
			message = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_MESSAGE));
		}

		int length = Snackbar.LENGTH_SHORT;
		if (proxy.hasProperty(TiC.PROPERTY_LENGTH)) {
			length = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_LENGTH), Snackbar.LENGTH_SHORT);
		}

		Snackbar snack = Snackbar.make(view, message, length);
		if (proxy.hasProperty(TiC.PROPERTY_ACTION)) {
			String action = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_ACTION));
			snack.setAction(action, v -> {
				KrollDict kd = new KrollDict();
				kd.put("action", action);
				fireEvent(TiC.EVENT_CLICK, kd);
			});
		}
		snack.show();
	}
}
