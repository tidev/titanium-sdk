package org.appcelerator.titanium.view;

import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.view.View;

public interface ITiWindowHandler
{
	public void addWindow(View v, LayoutParams params);
	public void removeWindow(View v);
}
