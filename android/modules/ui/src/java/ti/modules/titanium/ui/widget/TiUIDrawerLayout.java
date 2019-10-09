/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import ti.modules.titanium.ui.ToolbarProxy;
import ti.modules.titanium.ui.android.DrawerLayoutProxy;
import ti.modules.titanium.ui.WindowProxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.support.v4.widget.DrawerLayout;
import android.support.v4.widget.DrawerLayout.LayoutParams;
import android.support.v4.widget.ViewDragHelper;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import java.lang.reflect.Field;

public class TiUIDrawerLayout extends TiUIView
{

	private DrawerLayout layout = null;
	private ActionBarDrawerToggle drawerToggle = null;

	private FrameLayout leftFrame = null;
	private FrameLayout rightFrame = null;
	private int leftWidth;
	private int rightWidth;

	private Toolbar toolbar;
	private boolean toolbarEnabled = true;
	private boolean themeHasActionBar = true;

	private TiViewProxy leftView;
	private TiViewProxy rightView;
	private TiViewProxy centerView;

	private AppCompatActivity activity;

	private static final String TAG = "TiUIDrawerLayout";

	static int id_drawer_open_string = 0;
	static int id_drawer_close_string = 0;
	static int id_drawer_layout = 0;
	static int id_drawer_layout_container = 0;
	static int id_toolbar = 0;

	public TiUIDrawerLayout(final DrawerLayoutProxy proxy)
	{
		super(proxy);

		try {
			if (id_drawer_open_string == 0) {
				id_drawer_open_string = TiRHelper.getResource("string.drawer_layout_open");
			}
			if (id_drawer_close_string == 0) {
				id_drawer_close_string = TiRHelper.getResource("string.drawer_layout_close");
			}
			if (id_drawer_layout == 0) {
				id_drawer_layout = TiRHelper.getResource("layout.titanium_ui_drawer_layout");
			}
			if (id_drawer_layout_container == 0) {
				id_drawer_layout_container = TiRHelper.getResource("id.drawer_layout_container");
			}
			if (id_toolbar == 0) {
				id_toolbar = TiRHelper.getResource("id.drawer_layout_toolbar");
			}
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "XML resources could not be found!!!");
		}
		this.activity = (AppCompatActivity) proxy.getActivity();
		LayoutInflater inflater = LayoutInflater.from(this.activity);
		layout = (DrawerLayout) inflater.inflate(id_drawer_layout, null, false);
		toolbar = (Toolbar) layout.findViewById(id_toolbar);

		// Check if the theme provides a default ActionBar
		if (this.activity.getSupportActionBar() == null) {
			this.themeHasActionBar = false;
		}

		setNativeView(layout);
	}

	private void setToolbarVisible(boolean visible)
	{
		if (visible) {
			toolbar.setVisibility(View.VISIBLE);
		} else {
			toolbar.setVisibility(View.GONE);
		}
	}

	private void drawerClosedEvent(View drawerView)
	{
		if (proxy.hasListeners(TiC.EVENT_CLOSE)) {
			KrollDict options = new KrollDict();
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_CLOSE, options);
		}
	}

	private void drawerOpenedEvent(View drawerView)
	{
		if (proxy.hasListeners(TiC.EVENT_OPEN)) {
			KrollDict options = new KrollDict();
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_OPEN, options);
		}
	}

	private void drawerStateChangedEvent(int state)
	{
		if (proxy.hasListeners(TiC.EVENT_CHANGE)) {
			KrollDict options = new KrollDict();
			options.put("state", state);
			options.put("idle", (state == DrawerLayout.STATE_IDLE));
			options.put("dragging", (state == DrawerLayout.STATE_DRAGGING));
			options.put("settling", (state == DrawerLayout.STATE_SETTLING));
			proxy.fireEvent(TiC.EVENT_CHANGE, options);
		}
	}

	private void drawerSlideEvent(View drawerView, float slideOffset)
	{
		if (proxy.hasListeners(TiC.EVENT_SLIDE)) {
			KrollDict options = new KrollDict();
			options.put("offset", slideOffset);
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_SLIDE, options);
		}
	}

	public void toggleLeft()
	{
		if (layout.isDrawerOpen(Gravity.START)) {
			closeLeft();
		} else {
			openLeft();
		}
	}

	public void openLeft()
	{
		layout.openDrawer(Gravity.START);
	}

	public void closeLeft()
	{
		layout.closeDrawer(Gravity.START);
	}

	public void toggleRight()
	{
		if (layout.isDrawerOpen(Gravity.END)) {
			closeRight();
		} else {
			openRight();
		}
	}

	public void openRight()
	{
		layout.openDrawer(Gravity.END);
	}

	public void closeRight()
	{
		layout.closeDrawer(Gravity.END);
	}

	public boolean isLeftOpen()
	{
		return layout.isDrawerOpen(Gravity.START);
	}

	public boolean isRightOpen()
	{
		return layout.isDrawerOpen(Gravity.END);
	}

	public boolean isLeftVisible()
	{
		return layout.isDrawerVisible(Gravity.START);
	}

	public boolean isRightVisible()
	{
		return layout.isDrawerVisible(Gravity.END);
	}

	private void initDrawerToggle()
	{

		final AppCompatActivity activity = (AppCompatActivity) proxy.getActivity();
		if (activity == null) {
			return;
		}
		if (activity.getSupportActionBar() != null) {
			activity.getSupportActionBar().setHomeButtonEnabled(true);
		}

		drawerToggle = new ActionBarDrawerToggle(activity, layout, id_drawer_open_string, id_drawer_close_string) {
			@Override
			public void onDrawerClosed(View drawerView)
			{
				super.onDrawerClosed(drawerView);
				drawerClosedEvent(drawerView);
			}

			@Override
			public void onDrawerOpened(View drawerView)
			{
				super.onDrawerOpened(drawerView);
				drawerOpenedEvent(drawerView);
			}

			@Override
			public void onDrawerSlide(View drawerView, float slideOffset)
			{
				super.onDrawerSlide(drawerView, slideOffset);
				drawerSlideEvent(drawerView, slideOffset);
			}

			@Override
			public void onDrawerStateChanged(int state)
			{
				super.onDrawerStateChanged(state);
				drawerStateChangedEvent(state);
			}
		};
		layout.addDrawerListener(drawerToggle);
		layout.post(new Runnable() {
			@Override
			public void run()
			{
				drawerToggle.syncState();
			}
		});
	}

	private void initLeft()
	{
		if (leftFrame != null) {
			return;
		}
		leftFrame = new FrameLayout(proxy.getActivity());

		LayoutParams frameLayout = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
		frameLayout.gravity = Gravity.START;
		leftFrame.setLayoutParams(frameLayout);

		layout.addView(leftFrame);

		if (drawerToggle == null) {
			initDrawerToggle();
		}
	}

	private void initRight()
	{
		if (rightFrame != null) {
			return;
		}
		rightFrame = new FrameLayout(proxy.getActivity());

		LayoutParams frameLayout = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
		frameLayout.gravity = Gravity.END;
		rightFrame.setLayoutParams(frameLayout);

		layout.addView(rightFrame);
	}

	public void setCenterView(TiViewProxy viewProxy)
	{
		if (viewProxy == null || viewProxy == this.centerView) {
			return;
		}

		viewProxy.setActivity(proxy.getActivity());
		TiUIView contentView = viewProxy.getOrCreateView();

		View view = contentView.getOuterView();
		LinearLayout container = (LinearLayout) layout.findViewById(id_drawer_layout_container);
		TiCompositeLayout content = (TiCompositeLayout) container.getChildAt(1);
		ViewParent viewParent = view.getParent();
		if (viewParent != null && viewParent != content && viewParent instanceof ViewGroup) {
			((ViewGroup) viewParent).removeView(view);
		}
		content.addView(view, contentView.getLayoutParams());
		if (this.centerView != null) {
			content.removeView(this.centerView.getOrCreateView().getNativeView());
		}
		this.centerView = viewProxy;
	}

	private void setDrawMargin(Integer width)
	{
		try {
			Field mDragger = layout.getClass().getDeclaredField("mLeftDragger");
			mDragger.setAccessible(true);
			ViewDragHelper draggerObj = (ViewDragHelper) mDragger.get(layout);
			Field mEdgeSize = draggerObj.getClass().getDeclaredField("mEdgeSize");
			mEdgeSize.setAccessible(true);
			mEdgeSize.setInt(draggerObj, width);
		} catch (NoSuchFieldException e) {
			Log.e(TAG, e.toString());
		} catch (IllegalAccessException e) {
			Log.e(TAG, e.toString());
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_LEFT_VIEW)) {
			Object leftView = d.get(TiC.PROPERTY_LEFT_VIEW);
			if (leftView != null && leftView instanceof TiViewProxy) {
				if (leftView instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				this.leftView = (TiViewProxy) leftView;
				this.initLeft();
				this.leftFrame.addView(getNativeView(this.leftView));
			} else {
				Log.e(TAG, "invalid type for leftView");
			}
		}
		if (d.containsKey(TiC.PROPERTY_RIGHT_VIEW)) {
			Object rightView = d.get(TiC.PROPERTY_RIGHT_VIEW);
			if (rightView != null && rightView instanceof TiViewProxy) {
				if (rightView instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				this.rightView = (TiViewProxy) rightView;
				this.initRight();
				this.rightFrame.addView(getNativeView(this.rightView));
			} else {
				Log.e(TAG, "invalid type for rightView");
			}
		}
		if (d.containsKey(TiC.PROPERTY_CENTER_VIEW)) {
			Object centerView = d.get(TiC.PROPERTY_CENTER_VIEW);
			if (centerView != null && centerView instanceof TiViewProxy) {
				if (centerView instanceof WindowProxy) {
					throw new IllegalStateException("cannot use window as a child view of other window");
				}
				setCenterView((TiViewProxy) centerView);
			} else {
				Log.e(TAG, "invalid type for centerView");
			}
		}
		if (d.containsKey(TiC.PROPERTY_LEFT_WIDTH)) {
			if (leftFrame != null) {
				if (d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.LAYOUT_SIZE)) {
					leftFrame.getLayoutParams().width = LayoutParams.WRAP_CONTENT;
				} else if (d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.LAYOUT_FILL)) {
					leftFrame.getLayoutParams().width = LayoutParams.MATCH_PARENT;
				} else if (!d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.SIZE_AUTO)) {
					leftWidth = getDevicePixels(d.get(TiC.PROPERTY_LEFT_WIDTH));
					leftFrame.getLayoutParams().width = leftWidth;
				}
			}
		} else {
			if (leftFrame != null) {
				leftFrame.getLayoutParams().width = LayoutParams.MATCH_PARENT;
			}
		}
		if (d.containsKey(TiC.PROPERTY_RIGHT_WIDTH)) {
			if (rightFrame != null) {
				if (d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.LAYOUT_SIZE)) {
					rightFrame.getLayoutParams().width = LayoutParams.WRAP_CONTENT;
				} else if (d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.LAYOUT_FILL)) {
					rightFrame.getLayoutParams().width = LayoutParams.MATCH_PARENT;
				} else if (!d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.SIZE_AUTO)) {
					rightWidth = getDevicePixels(d.get(TiC.PROPERTY_RIGHT_WIDTH));
					rightFrame.getLayoutParams().width = rightWidth;
				}
			}
		} else {
			if (rightFrame != null) {
				rightFrame.getLayoutParams().width = LayoutParams.MATCH_PARENT;
			}
		}
		if (d.containsKey(TiC.PROPERTY_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(d.get(TiC.PROPERTY_DRAWER_LOCK_MODE)));
		}
		if (d.containsKey(TiC.PROPERTY_LEFT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(d.get(TiC.PROPERTY_LEFT_DRAWER_LOCK_MODE)), Gravity.START);
		}
		if (d.containsKey(TiC.PROPERTY_RIGHT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(d.get(TiC.PROPERTY_RIGHT_DRAWER_LOCK_MODE)), Gravity.END);
		}
		// If theme has default ActionBar ignore `toolbarEnabled` and `toolbar` properties
		if (!this.themeHasActionBar) {
			if (d.containsKey(TiC.PROPERTY_TOOLBAR_ENABLED)) {
				toolbarEnabled = TiConvert.toBoolean(d.get(TiC.PROPERTY_TOOLBAR_ENABLED));
				setToolbarVisible(toolbarEnabled);
			}
			if (d.containsKey(TiC.PROPERTY_TOOLBAR)) {
				// Hide embedded toolbar if a custom one was provided
				setToolbarVisible(false);
				ViewGroup.LayoutParams layoutParams = this.toolbar.getLayoutParams();
				// Replace the current toolbar reference with the custom one
				this.toolbar = ((Toolbar) ((ToolbarProxy) d.get(TiC.PROPERTY_TOOLBAR)).getToolbarInstance());
				// Add it as a first child in the layout container
				((LinearLayout) layout.findViewById(id_drawer_layout_container)).addView(this.toolbar, 0, layoutParams);
				setToolbarVisible(toolbarEnabled);
			}
			// Only set the toolbar as ActionBar after we have processes proxy's properties
			this.activity.setSupportActionBar(this.toolbar);
		}
		if (d.containsKey(TiC.PROPERTY_DRAG_MARGIN)) {
			setDrawMargin(getDevicePixels(d.get(TiC.PROPERTY_DRAG_MARGIN)));
		}
		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{

		if (key.equals(TiC.PROPERTY_LEFT_VIEW)) {
			if (newValue == null || newValue == this.leftView) {
				return;
			}
			TiViewProxy newProxy = null;
			int index = 0;
			if (this.leftView != null) {
				index = this.leftFrame.indexOfChild(this.leftView.getOrCreateView().getNativeView());
			}
			if (newValue instanceof TiViewProxy) {
				if (newValue instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				newProxy = (TiViewProxy) newValue;
				initLeft();
				this.leftFrame.addView(newProxy.getOrCreateView().getOuterView(), index);
			} else {
				Log.e(TAG, "invalid type for leftView");
			}
			if (this.leftView != null) {
				this.leftFrame.removeView(this.leftView.getOrCreateView().getNativeView());
			}
			this.leftView = newProxy;

		} else if (key.equals(TiC.PROPERTY_RIGHT_VIEW)) {
			if (newValue == null || newValue == this.rightView) {
				return;
			}
			TiViewProxy newProxy = null;
			int index = 0;
			if (this.rightView != null) {
				index = this.rightFrame.indexOfChild(this.rightView.getOrCreateView().getNativeView());
			}
			if (newValue instanceof TiViewProxy) {
				if (newValue instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				newProxy = (TiViewProxy) newValue;
				initRight();
				this.rightFrame.addView(newProxy.getOrCreateView().getOuterView(), index);
			} else {
				Log.e(TAG, "invalid type for rightView");
			}
			if (this.rightView != null) {
				this.rightFrame.removeView(this.rightView.getOrCreateView().getNativeView());
			}
			this.rightView = newProxy;

		} else if (key.equals(TiC.PROPERTY_CENTER_VIEW)) {
			TiViewProxy newProxy = (TiViewProxy) newValue;
			setCenterView(newProxy);

		} else if (key.equals(TiC.PROPERTY_LEFT_WIDTH)) {
			if (leftFrame == null) {
				return;
			}
			initLeft();

			if (newValue.equals(TiC.LAYOUT_SIZE)) {
				leftWidth = LayoutParams.WRAP_CONTENT;
			} else if (newValue.equals(TiC.LAYOUT_FILL)) {
				leftWidth = LayoutParams.MATCH_PARENT;
			} else if (!newValue.equals(TiC.SIZE_AUTO)) {
				leftWidth = getDevicePixels(newValue);
			}

			LayoutParams leftFrameLayout = new LayoutParams(leftWidth, LayoutParams.MATCH_PARENT);
			leftFrameLayout.gravity = Gravity.START;
			this.leftFrame.setLayoutParams(leftFrameLayout);

		} else if (key.equals(TiC.PROPERTY_RIGHT_WIDTH)) {
			if (rightFrame == null) {
				return;
			}
			initRight();

			if (newValue.equals(TiC.LAYOUT_SIZE)) {
				rightWidth = LayoutParams.WRAP_CONTENT;
			} else if (newValue.equals(TiC.LAYOUT_FILL)) {
				rightWidth = LayoutParams.MATCH_PARENT;
			} else if (!newValue.equals(TiC.SIZE_AUTO)) {
				rightWidth = getDevicePixels(newValue);
			}

			LayoutParams rightFrameLayout = new LayoutParams(rightWidth, LayoutParams.MATCH_PARENT);
			rightFrameLayout.gravity = Gravity.END;
			this.rightFrame.setLayoutParams(rightFrameLayout);

		} else if (key.equals(TiC.PROPERTY_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_LEFT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue), Gravity.START);
		} else if (key.equals(TiC.PROPERTY_RIGHT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue), Gravity.END);
		} else if (key.equals(TiC.PROPERTY_DRAWER_INDICATOR_ENABLED)) {
			if (drawerToggle != null) {
				drawerToggle.setDrawerIndicatorEnabled((Boolean) newValue);
			}

		} else if (key.equals(TiC.PROPERTY_TOOLBAR_ENABLED)) {
			// If we already have a Toolbar set ignore this property
			if (!this.themeHasActionBar) {
				toolbarEnabled = TiConvert.toBoolean(newValue);
				setToolbarVisible(toolbarEnabled);
			}
		} else if (key.equals(TiC.PROPERTY_DRAG_MARGIN)) {
			setDrawMargin(getDevicePixels(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void release()
	{
		if (layout != null) {
			layout.removeAllViews();
			layout.removeDrawerListener(drawerToggle);
			layout = null;
		}
		if (leftFrame != null) {
			leftFrame.removeAllViews();
			leftFrame = null;
		}
		if (rightFrame != null) {
			rightFrame.removeAllViews();
			rightFrame = null;
		}
		if (leftView != null) {
			leftView.releaseViews();
			leftView = null;
		}
		if (rightView != null) {
			rightView.releaseViews();
			rightView = null;
		}
		if (centerView != null) {
			centerView.releaseViews();
			centerView = null;
		}
		if (toolbar != null) {
			toolbar.removeAllViews();
			toolbar = null;
		}
		super.release();
		proxy = null;
	}

	private int getDevicePixels(Object value)
	{
		TiDimension nativeSize = TiConvert.toTiDimension(TiConvert.toString(value), TiDimension.TYPE_WIDTH);
		return nativeSize.getAsPixels(layout);
	}

	private View getNativeView(TiViewProxy viewProxy)
	{
		TiUIView view = viewProxy.getOrCreateView();
		View outerView = view.getOuterView();
		View nativeView = outerView != null ? outerView : view.getNativeView();
		ViewGroup parentViewGroup = (ViewGroup) nativeView.getParent();
		if (parentViewGroup != null) {
			parentViewGroup.removeAllViews();
		}
		return nativeView;
	}
}
