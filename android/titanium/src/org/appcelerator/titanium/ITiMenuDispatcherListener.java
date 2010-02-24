package org.appcelerator.titanium;

import android.view.Menu;
import android.view.MenuItem;

public interface ITiMenuDispatcherListener
{
	public boolean dispatchHasMenu();
	boolean dispatchMenuItemSelected(MenuItem item);
	public boolean dispatchPrepareMenu(Menu menu);
}
