/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

import java.util.Stack;

@Kroll.proxy(creatableInModule = UIModule.class)
public class NavigationWindowProxy extends WindowProxy
{
	private static final String TAG = "NavigationWindowProxy";

	private Stack<WindowProxy> windows = new Stack<>();

	public NavigationWindowProxy()
	{
		super();
	}

	// clang-format off
	@Override
	@Kroll.method
	public void open(@Kroll.argument(optional = true) Object arg)
	// clang-format on
	{
		if (getProperties().containsKeyAndNotNull(TiC.PROPERTY_WINDOW)) {
			opened = true;
			WindowProxy window = (WindowProxy) getProperties().get(TiC.PROPERTY_WINDOW);
			windows.add(window);
			window.open(arg);
			return;
		}
		super.open(arg);
	}

	// clang-format off
	@Kroll.method
	public void popToRootWindow(@Kroll.argument(optional = true) Object arg)
	// clang-format on
	{
		for (WindowProxy window : windows) {
			window.close(arg);
		}
		windows.removeAllElements();
	}

	// clang-format off
	@Override
	@Kroll.method
	public void close(@Kroll.argument(optional = true) Object arg)
	// clang-format on
	{
		popToRootWindow(arg);
		super.close(arg);
	}

	// clang-format off
	@Kroll.method
	public void openWindow(WindowProxy window, @Kroll.argument(optional = true) Object arg)
	// clang-format on
	{
		if (!opened) {
			open(null);
		}
		window.setNavigationWindow(this);
		windows.add(window);
		window.open(arg);
	}

	// clang-format off
	@Kroll.method
	public void closeWindow(WindowProxy window, @Kroll.argument(optional = true) Object arg)
	// clang-format on
	{
		windows.remove(window);
		window.close(arg);
		window.setNavigationWindow(null);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.NavigationWindow";
	}
}
