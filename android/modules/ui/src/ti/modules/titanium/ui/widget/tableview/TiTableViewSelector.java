/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.io.IOException;
import java.util.Arrays;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.PorterDuff.Mode;
import android.graphics.Rect;
import android.graphics.Region;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.widget.ListView;

public class TiTableViewSelector extends Drawable {
	private static final String TAG = "TiTableViewSelector";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected Drawable defaultSelector;
	protected TiTableView tableView;
	protected ListView listView;
	protected int selectedPosition = -1;
	protected View selectedView;
	protected Drawable selectedDrawable;
	protected Rect bounds;
	
	public TiTableViewSelector(TiTableView tableView) {
		this.tableView = tableView;
		this.listView = tableView.getListView();
		defaultSelector = listView.getSelector();
		listView.setOnTouchListener(new OnTouchListener() {
			@Override
			public boolean onTouch(View view, MotionEvent event) {
				touchEvent(event);
				return false;
			}
		});
	}
	
	protected void touchEvent(MotionEvent event) {
		if (DBG) {
			Log.d(TAG, "onTouch, x: " + event.getX() + ", y: " + event.getY());
		}
		int x = (int)event.getX();
		int y = (int)event.getY();
		int first = listView.getFirstVisiblePosition();
		int last = listView.getLastVisiblePosition();

		// Iterate the visible list items and find which one was touched (if any)
		for (int i = first; i <= last; i++) {
			Rect rect = new Rect();
			View child = listView.getChildAt(i - first);
			rect.top = child.getTop();
			rect.bottom = child.getBottom();
			rect.left = child.getLeft();
			rect.right = child.getRight();
			if (rect.contains(x, y)) {
				if (selectedView != child) {
					selectedDrawable = null;
				}
				selectedView = child;
			}
		}
	}
	
	public void keyEvent(int keyCode, int repeatCount, KeyEvent event) {
		int position = listView.getSelectedItemPosition();
		int listCount = listView.getCount();
		if (DBG) {
			Log.d(TAG, "keyCode: " + keyCode + ", event: " + event + ", position: " + position);
		}
		// Mirrors logic in ListView
		if (event.getAction() != KeyEvent.ACTION_UP) {
			if (position < 0) {
				switch (keyCode) {
					case KeyEvent.KEYCODE_DPAD_UP:
					case KeyEvent.KEYCODE_DPAD_DOWN:
					case KeyEvent.KEYCODE_DPAD_CENTER:
					case KeyEvent.KEYCODE_ENTER:
					case KeyEvent.KEYCODE_SPACE:
						// this is where ListView resurrects the position internally,
						// we'll need to read it somehow (reflection?)
						if (listCount > 0) {
							setSelectedChild(null, 0);
						}
						break;
				}
			} else {
				int finalPosition = listCount - 1;
				switch (keyCode) {
					case KeyEvent.KEYCODE_DPAD_UP:
						if (!event.isAltPressed()) {
							setSelectedChild(null, position - repeatCount < 0 ? 0 : position - repeatCount);
						} else {
							setSelectedChild(null, 0);
						} break;
					case KeyEvent.KEYCODE_DPAD_DOWN:
						if (!event.isAltPressed()) {
							setSelectedChild(null, position + repeatCount > finalPosition ? finalPosition : position + repeatCount);
						} else {
							setSelectedChild(null, listCount - 1);
						} break;
					case KeyEvent.KEYCODE_SPACE:
						int pageSize = listView.getLastVisiblePosition() - listView.getFirstVisiblePosition();
						if (!event.isShiftPressed()) {
							setSelectedChild(null, position + pageSize > finalPosition ? finalPosition : position + pageSize);
						} else {
							setSelectedChild(null, position - pageSize < 0 ? 0 : position - pageSize);
						} break;
				}
				listView.refreshDrawableState();
			}
		}
	}
	
	protected void setSelectedChild(View child, int position) {
		if (selectedView != child) {
			selectedDrawable = null;
		}
		selectedView = child;
		selectedPosition = position;
		listView.refreshDrawableState();
	}

	protected Drawable getSelectedDrawable() {
		if (selectedDrawable == null || selectedDrawable == defaultSelector) {
			boolean setBounds = false;
			if (selectedView == null && selectedPosition >= 0) {
				selectedView = listView.getChildAt(selectedPosition - listView.getFirstVisiblePosition());
				setBounds = true;
			}
			
			if (selectedView != null) {
				if (selectedView instanceof TiBaseTableViewItem) {
					TiBaseTableViewItem rowView = (TiBaseTableViewItem)selectedView;
					if (rowView.hasSelector()) {
						selectedDrawable = rowView.getSelectorDrawable();
						if (setBounds && this.bounds != null) {
							selectedDrawable.setBounds(bounds);
						}
					}
				}
			}
		}
		if (selectedDrawable == null) {
			selectedDrawable = defaultSelector;
		}
		return selectedDrawable;
	}

	public void clearColorFilter() {
		getSelectedDrawable().clearColorFilter();
	}
	public void draw(Canvas canvas) {
		getSelectedDrawable().draw(canvas);
	}
	public boolean equals(Object o) {
		return getSelectedDrawable().equals(o);
	}
	public int getChangingConfigurations() {
		return getSelectedDrawable().getChangingConfigurations();
	}
	public ConstantState getConstantState() {
		return getSelectedDrawable().getConstantState();
	}
	public Drawable getCurrent() {
		return getSelectedDrawable().getCurrent();
	}
	public int getIntrinsicHeight() {
		return getSelectedDrawable().getIntrinsicHeight();
	}
	public int getIntrinsicWidth() {
		return getSelectedDrawable().getIntrinsicWidth();
	}
	public int getMinimumHeight() {
		return getSelectedDrawable().getMinimumHeight();
	}
	public int getMinimumWidth() {
		return getSelectedDrawable().getMinimumWidth();
	}
	public int getOpacity() {
		return getSelectedDrawable().getOpacity();
	}
	public boolean getPadding(Rect padding) {
		return getSelectedDrawable().getPadding(padding);
	}
	public int[] getState() {
		return getSelectedDrawable().getState();
	}
	public Region getTransparentRegion() {
		return getSelectedDrawable().getTransparentRegion();
	}
	public int hashCode() {
		return getSelectedDrawable().hashCode();
	}
	public void inflate(Resources r, XmlPullParser parser, AttributeSet attrs)
			throws XmlPullParserException, IOException {
		getSelectedDrawable().inflate(r, parser, attrs);
	}
	public void invalidateSelf() {
		getSelectedDrawable().invalidateSelf();
	}
	public boolean isStateful() {
		return getSelectedDrawable().isStateful();
	}
	public Drawable mutate() {
		return getSelectedDrawable().mutate();
	}
	public void scheduleSelf(Runnable what, long when) {
		getSelectedDrawable().scheduleSelf(what, when);
	}
	public void setAlpha(int alpha) {
		getSelectedDrawable().setAlpha(alpha);
	}
	public void setBounds(int left, int top, int right, int bottom) {
		setBounds(new Rect(left, top, right, bottom));
	}
	public void setBounds(Rect bounds) {
		this.bounds = bounds;
		getSelectedDrawable().setBounds(bounds);
	}
	public void setChangingConfigurations(int configs) {
		getSelectedDrawable().setChangingConfigurations(configs);
	}
	public void setColorFilter(ColorFilter cf) {
		getSelectedDrawable().setColorFilter(cf);
	}
	public void setColorFilter(int color, Mode mode) {
		getSelectedDrawable().setColorFilter(color, mode);
	}
	public void setDither(boolean dither) {
		getSelectedDrawable().setDither(dither);
	}
	public void setFilterBitmap(boolean filter) {
		getSelectedDrawable().setFilterBitmap(filter);
	}
	public boolean setState(int[] stateSet) {
		if (DBG) {
			Log.d(TAG, "setState: " + Arrays.toString(stateSet));
		}
		return getSelectedDrawable().setState(stateSet);
	}
	public boolean setVisible(boolean visible, boolean restart) {
		return getSelectedDrawable().setVisible(visible, restart);
	}
	public String toString() {
		return getSelectedDrawable().toString();
	}
	public void unscheduleSelf(Runnable what) {
		getSelectedDrawable().unscheduleSelf(what);
	}
}
