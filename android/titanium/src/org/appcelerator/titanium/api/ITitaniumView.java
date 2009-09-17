package org.appcelerator.titanium.api;

import android.content.res.Configuration;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

public interface ITitaniumView
{
	boolean isPrimary();
	void requestLayout();
	String getName();
	void setName(String name);
	void showing();
	void hiding();

	int addEventListener(String eventName, String listener);
	void removeEventListener(String eventName, int listenerId);


	void dispatchWindowFocusChanged(boolean hasFocus);
	void dispatchConfigurationChange(Configuration newConfig);

	boolean dispatchPrepareOptionsMenu(Menu menu);
	boolean dispatchOptionsItemSelected(MenuItem item);

	void dispatchApplicationEvent(String eventName, String data);

	ITitaniumLifecycle getLifecycle();
	View getNativeView();

	String getKey();
	void setKey(String key);

	void processOptions(String options);
}
