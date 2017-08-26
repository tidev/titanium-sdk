/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import ti.modules.titanium.ui.widget.TiUIDrawerLayout;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Message;
import android.support.v4.widget.DrawerLayout;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class DrawerLayoutProxy extends TiViewProxy
{
    @Kroll.constant public static final int LOCK_MODE_LOCKED_CLOSED = DrawerLayout.LOCK_MODE_LOCKED_CLOSED;
    @Kroll.constant public static final int LOCK_MODE_LOCKED_OPEN = DrawerLayout.LOCK_MODE_LOCKED_OPEN;
    @Kroll.constant public static final int LOCK_MODE_UNLOCKED = DrawerLayout.LOCK_MODE_UNLOCKED;

    private static final String TAG = "DrawerLayoutProxy";

    private TiUIDrawerLayout drawer;

    public DrawerLayoutProxy() {
        super();
    }

    @Override
    public TiUIView createView(Activity activity) {
        drawer = new TiUIDrawerLayout(this);
        drawer.getLayoutParams().autoFillsHeight = true;
        drawer.getLayoutParams().autoFillsWidth = true;
        return drawer;
    }

    @Kroll.method(runOnUiThread=true)
    public void toggleLeft() {
        drawer.toggleLeft();
    }

    @Kroll.method(runOnUiThread=true)
    public void openLeft() {
        drawer.openLeft();
    }

    @Kroll.method(runOnUiThread=true)
    public void closeLeft() {
        drawer.closeLeft();
    }

    @Kroll.method(runOnUiThread=true)
    public void toggleRight() {
        drawer.toggleRight();
    }

    @Kroll.method(runOnUiThread=true)
    public void openRight() {
        drawer.openRight();
    }

    @Kroll.method(runOnUiThread=true)
    public void closeRight() {
        drawer.closeRight();
    }

    @Kroll.method
    @Kroll.getProperty
    public boolean getIsLeftOpen() {
        return drawer.isLeftOpen();
    }

    @Kroll.method
    @Kroll.getProperty
    public boolean getIsRightOpen() {
        return drawer.isRightOpen();
    }

    @Kroll.method
    @Kroll.getProperty
    public boolean getIsLeftVisible() {
        return drawer.isLeftVisible();
    }

    @Kroll.method
    @Kroll.getProperty
    public boolean getIsRightVisible() {
        return drawer.isRightVisible();
    }

    @Kroll.method
    @Kroll.setProperty
    public void setLeftWidth(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_LEFT_WIDTH, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setLeftView(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_LEFT_VIEW, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setRightWidth(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_RIGHT_WIDTH, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setRightView(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_RIGHT_VIEW, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setCenterView(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_CENTER_VIEW, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setDrawerIndicatorEnabled(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_DRAWER_INDICATOR_ENABLED, arg);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setDrawerLockMode(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_DRAWER_LOCK_MODE, arg);
    }

    @Kroll.method
    public void interceptTouchEvent (TiViewProxy view, Boolean disallowIntercept){
        view.getOrCreateView().getOuterView().getParent().requestDisallowInterceptTouchEvent(disallowIntercept);
    }

    @Kroll.method
    @Kroll.setProperty
    public void setToolbarEnabled(Object arg) {
        setPropertyAndFire(TiC.PROPERTY_TOOLBAR_ENABLED, arg);
    }
}
