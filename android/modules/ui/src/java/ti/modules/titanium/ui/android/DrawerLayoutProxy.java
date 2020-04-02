/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import ti.modules.titanium.ui.widget.TiUIDrawerLayout;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import androidx.drawerlayout.widget.DrawerLayout;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class DrawerLayoutProxy extends TiViewProxy
{
	@Kroll.constant
	public static final int LOCK_MODE_LOCKED_CLOSED = DrawerLayout.LOCK_MODE_LOCKED_CLOSED;
	@Kroll.constant
	public static final int LOCK_MODE_LOCKED_OPEN = DrawerLayout.LOCK_MODE_LOCKED_OPEN;
	@Kroll.constant
	public static final int LOCK_MODE_UNLOCKED = DrawerLayout.LOCK_MODE_UNLOCKED;
	@Kroll.constant
	public static final int LOCK_MODE_UNDEFINED = DrawerLayout.LOCK_MODE_UNDEFINED;

	private static final String TAG = "DrawerLayoutProxy";

	private TiUIDrawerLayout drawer;

	public DrawerLayoutProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		drawer = new TiUIDrawerLayout(this);
		drawer.getLayoutParams().autoFillsHeight = true;
		drawer.getLayoutParams().autoFillsWidth = true;
		return drawer;
	}

	@Kroll.method
	public void toggleLeft()
	{
		if (drawer != null) {
			drawer.toggleLeft();
		}
	}

	@Kroll.method
	public void openLeft()
	{
		if (drawer != null) {
			drawer.openLeft();
		}
	}

	@Kroll.method
	public void closeLeft()
	{
		if (drawer != null) {
			drawer.closeLeft();
		}
	}

	@Kroll.method
	public void toggleRight()
	{
		if (drawer != null) {
			drawer.toggleRight();
		}
	}

	@Kroll.method
	public void openRight()
	{
		if (drawer != null) {
			drawer.openRight();
		}
	}

	@Kroll.method
	public void closeRight()
	{
		if (drawer != null) {
			drawer.closeRight();
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getIsLeftOpen()
	{
		return drawer != null && drawer.isLeftOpen();
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getIsRightOpen()
	{
		return drawer != null && drawer.isRightOpen();
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getIsLeftVisible()
	{
		return drawer != null && drawer.isLeftVisible();
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getIsRightVisible()
	{
		return drawer != null && drawer.isRightVisible();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLeftWidth(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_LEFT_WIDTH, arg);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLeftView(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_LEFT_VIEW, arg);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setRightWidth(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_RIGHT_WIDTH, arg);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setRightView(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_RIGHT_VIEW, arg);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setCenterView(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_CENTER_VIEW, arg);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getDrawerIndicatorEnabled()
	{
		if (hasProperty(TiC.PROPERTY_DRAWER_INDICATOR_ENABLED)) {
			return (Boolean) getProperty(TiC.PROPERTY_DRAWER_INDICATOR_ENABLED);
		}
		return true;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setDrawerIndicatorEnabled(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_DRAWER_INDICATOR_ENABLED, arg);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getDrawerLockMode()
	{
		if (hasProperty(TiC.PROPERTY_DRAWER_LOCK_MODE)) {
			return (Integer) getProperty(TiC.PROPERTY_DRAWER_LOCK_MODE);
		}
		return LOCK_MODE_UNDEFINED;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setDrawerLockMode(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_DRAWER_LOCK_MODE, arg);
	}

	@Kroll.method
	public void interceptTouchEvent(TiViewProxy view, Boolean disallowIntercept)
	{
		view.getOrCreateView().getOuterView().getParent().requestDisallowInterceptTouchEvent(disallowIntercept);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getToolbarEnabled()
	{
		if (hasProperty(TiC.PROPERTY_TOOLBAR_ENABLED)) {
			return (Boolean) getProperty(TiC.PROPERTY_TOOLBAR_ENABLED);
		}
		return true;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setToolbarEnabled(Object arg)
	{
		setPropertyAndFire(TiC.PROPERTY_TOOLBAR_ENABLED, arg);
	}
}
