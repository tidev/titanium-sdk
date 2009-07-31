package org.appcelerator.titanium.api;

import android.content.res.Configuration;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

public interface ITitaniumView
{
	boolean isPrimary();
	void requestLayout();

	void dispatchWindowFocusChanged(boolean hasFocus);
	void dispatchConfigurationChange(Configuration newConfig);

	boolean dispatchPrepareOptionsMenu(Menu menu);
	boolean dispatchOptionsItemSelected(MenuItem item);

	ITitaniumLifecycle getLifecycle();
	View getNativeView();
}
