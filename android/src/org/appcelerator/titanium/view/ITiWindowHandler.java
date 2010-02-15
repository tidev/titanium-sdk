package org.appcelerator.titanium.view;

import org.appcelerator.titanium.view.TitaniumCompositeLayout.TitaniumCompositeLayoutParams;

import android.view.View;

public interface ITiWindowHandler
{
	public void addWindow(View v, TitaniumCompositeLayoutParams params);
	public void removeWindow(View v);
}
