/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollPromise;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiWindowProxy;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;

@Kroll.proxy(creatableInModule = UIModule.class)
public class NavigationWindowProxy extends WindowProxy
{
	private static final String TAG = "NavigationWindowProxy";

	private final List<TiWindowProxy> windows = new ArrayList<>();

	public NavigationWindowProxy()
	{
		super();
	}

	@Override
	@Kroll.method
	public KrollPromise<Void> open(@Kroll.argument(optional = true) Object arg)
	{
		// FIXME: Shouldn't this complain/blow up if window isn't specified?
		if (!opened && getProperties().containsKeyAndNotNull(TiC.PROPERTY_WINDOW)) {
			opened = true;
			Object rootView = getProperties().get(TiC.PROPERTY_WINDOW);
			if (rootView instanceof WindowProxy || rootView instanceof TabGroupProxy) {
				openWindow(rootView, arg);
				fireEvent(TiC.EVENT_OPEN, null);
			}
			return KrollPromise.create((promise) -> {
				promise.resolve(null);
			});
		}
		return super.open(arg);
	}

	@Kroll.method
	public void popToRootWindow(@Kroll.argument(optional = true) Object arg)
	{
		// Keep first "root" window
		for (int i = windows.size() - 1; i > 0; i--) {
			TiWindowProxy window = windows.get(i);
			closeWindow(window, arg);
		}
	}

	protected void handleClose(@NonNull KrollDict options)
	{
		if (opened) {
			opened = false;
			popToRootWindow(options);
			closeWindow(windows.get(0), options); // close the root window
			fireEvent(TiC.EVENT_CLOSE, null);
			if (closePromise != null) {
				closePromise.resolve(null);
				closePromise = null;
			}
		}
		super.handleClose(options);
	}

	@Kroll.method
	public void openWindow(Object childToOpen, @Kroll.argument(optional = true) Object arg)
	{
		if (!opened) {
			open(null);
		}

		// Guard for types different from Window and TabGroup
		if (!(childToOpen instanceof TiWindowProxy)) {
			return;
		}
		windows.add(((TiWindowProxy) childToOpen));
		((TiWindowProxy) childToOpen).setNavigationWindow(this);
		if (childToOpen instanceof WindowProxy) {
			((WindowProxy) childToOpen).open(arg);
		} else if (childToOpen instanceof TabGroupProxy) {
			// tabgroup.js deals with passing the tabs from the creation dictionary to the native setTabs method.
			// In this case we need to do it manually since the JS "open()" does not get called.
			((TabGroupProxy) childToOpen).callPropertySync(TiC.PROPERTY_OPEN, new Object[] { arg });
		}
	}

	@Kroll.method
	public void closeWindow(Object childToClose, @Kroll.argument(optional = true) Object arg)
	{
		// TODO: If they try to close root window, yell at them:
		// DebugLog(@"[ERROR] Can not close the root window of the NavigationWindow. Close the NavigationWindow instead.");

		// Guard for types different from Window and TabGroup
		if (!(childToClose instanceof TiWindowProxy)) {
			return;
		}

		TiWindowProxy window = (TiWindowProxy) childToClose;
		windows.remove(window);
		window.setNavigationWindow(null);
		window.close(arg);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.NavigationWindow";
	}

	public TiWindowProxy getRootTiWindowProxy()
	{
		if (!windows.isEmpty()) {
			return windows.get(0);
		}
		return null;
	}
}
