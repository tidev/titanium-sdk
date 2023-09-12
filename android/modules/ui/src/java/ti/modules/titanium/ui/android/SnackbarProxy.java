/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import android.app.Activity;

import com.google.android.material.snackbar.Snackbar;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUISnackbar;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class SnackbarProxy extends TiViewProxy
{
	private static final String TAG = "SnackbarProxy";

	@Kroll.constant
	public static final int LENGTH_LONG = Snackbar.LENGTH_LONG;
	@Kroll.constant
	public static final int LENGTH_SHORT = Snackbar.LENGTH_SHORT;
	@Kroll.constant
	public static final int LENGTH_INDEFINITE = Snackbar.LENGTH_INDEFINITE;

	private TiUISnackbar snackbar;

	@Override
	public TiUIView createView(Activity activity)
	{
		snackbar = new TiUISnackbar(this);
		return snackbar;
	}

	@Kroll.method
	public void show()
	{
		snackbar.showMessage();
	}
}
