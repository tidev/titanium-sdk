package org.appcelerator.titanium.api;

import android.view.View;

public interface ITitaniumView
{
	boolean isPrimary();
	void requestLayout();
	void dispatchWindowFocusChanged(boolean hasFocus);
	ITitaniumLifecycle getLifecycle();
	View getNativeView();
}
