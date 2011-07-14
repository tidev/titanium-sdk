/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.util.TiConfig;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Rect;
import android.graphics.Region;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.DrawableContainer;
import android.graphics.drawable.StateListDrawable;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.widget.ListView;


public class TiTableViewSelector extends StateListDrawable implements Drawable.Callback
{
	private static final String LCAT = "TiTableViewSelector";
	private static final boolean DBG = TiConfig.LOGD;

	private ListView listView;
	private Drawable defaultDrawable;
	private Drawable selectedDrawable;


	class TouchListener implements OnTouchListener
	{
		@Override
		public boolean onTouch(View view, MotionEvent event)
		{
			if (event.getAction() == MotionEvent.ACTION_DOWN)
			{
				int touchPosition = listView.pointToPosition((int) event.getX(), (int) event.getY());
				selectedDrawable = getRowDrawable(listView.getChildAt(touchPosition - listView.getFirstVisiblePosition()));
			}
			else if (event.getAction() == MotionEvent.ACTION_UP)
			{
				selectedDrawable = defaultDrawable;
			}

			return false;
		}
	}


	public TiTableViewSelector(ListView listView)
	{
		this.listView = listView;

		defaultDrawable = listView.getSelector();
		selectedDrawable = defaultDrawable;

		listView.setOnTouchListener(new TouchListener());
	}


	public Drawable getRowDrawable(View row)
	{
		Drawable rowDrawable = null;

		if (row instanceof TiBaseTableViewItem)
		{
			TiBaseTableViewItem rowView = (TiBaseTableViewItem) row;
			if (rowView.hasSelector())
			{
				rowDrawable = rowView.getSelectorDrawable();
			}
		}

		if (rowDrawable == null)
		{
			rowDrawable = defaultDrawable;
		}

		return rowDrawable;
	}


	public void draw(Canvas canvas)
	{
		super.draw(canvas);
		if (!(listView.isInTouchMode()))
		{
			selectedDrawable = getRowDrawable(listView.getSelectedView());
			selectedDrawable.setBounds(getBounds());
		}

		selectedDrawable.draw(canvas);
	}


	public boolean onLevelChange(int level)
	{
		return super.onLevelChange(level);
	}

	public void setConstantState(DrawableContainer.DrawableContainerState state)
	{
		super.setConstantState(state);
	}


	public boolean selectDrawable (int idx)
	{
		if (selectedDrawable instanceof DrawableContainer)
		{
			return ((DrawableContainer) selectedDrawable).selectDrawable(idx);
		}
		else
		{
			return super.selectDrawable(idx);
		}
	}


	public boolean setVisible (boolean visible, boolean restart)
	{
		super.setVisible(visible, restart);
		return selectedDrawable.setVisible(visible, restart);
	}


	public void setChangingConfigurations (int configs)
	{
		super.setChangingConfigurations(configs);
		selectedDrawable.setChangingConfigurations(configs);
	}


	public boolean setState(int[] stateSet)
	{
		super.setState(stateSet);
		return selectedDrawable.setState(stateSet);
	}


	public void setBounds(int left, int top, int right, int bottom)
	{
		super.setBounds(left, top, right, bottom);
		selectedDrawable.setBounds(left, top, right, bottom);
	}


	public void setBounds(Rect bounds)
	{
		super.setBounds(bounds);
		selectedDrawable.setBounds(bounds);
	}


	public int getOpacity()
	{
		return selectedDrawable.getOpacity();
	}


	public void setAlpha(int alpha)
	{
		super.setAlpha(alpha);
		selectedDrawable.setAlpha(alpha);
	}


	public void setColorFilter(ColorFilter colorFilter)
	{
		super.setColorFilter(colorFilter);
		selectedDrawable.setColorFilter(colorFilter);
	}


	public void invalidateSelf ()
	{
		super.invalidateSelf();
		selectedDrawable.invalidateSelf();
	}


	public void scheduleSelf (Runnable runnable, long when)
	{
		super.scheduleSelf(runnable, when);
		selectedDrawable.scheduleSelf(runnable, when);
	}


	public Drawable mutate()
	{
		return selectedDrawable.mutate();
	}


	public boolean isStateful()
	{
		return selectedDrawable.isStateful();
	}


	public int[] getState()
	{
		if (selectedDrawable != null)
		{
			return selectedDrawable.getState();
		}

		return new int[0];
	}


	public boolean getPadding(Rect padding)
	{
		return selectedDrawable.getPadding(padding);
	}


	public Region getTransparentRegion()
	{
		return selectedDrawable.getTransparentRegion();
	}


	public int getMinimumWidth()
	{
		return selectedDrawable.getMinimumWidth();
	}


	public int getMinimumHeight()
	{
		return selectedDrawable.getMinimumHeight();
	}


	public int getIntrinsicHeight()
	{
		return selectedDrawable.getIntrinsicHeight();
	}


	public int getIntrinsicWidth()
	{
		return selectedDrawable.getIntrinsicWidth();
	}


	public Drawable getCurrent()
	{
		return selectedDrawable.getCurrent();
	}


	@Override
	public void invalidateDrawable(Drawable who)
	{
		super.invalidateDrawable(who);
		selectedDrawable.invalidateSelf();
	}


	@Override
	public void scheduleDrawable(Drawable drawable, Runnable runnable, long when)
	{
		super.scheduleDrawable(drawable, runnable, when);
	}


	@Override
	public void unscheduleDrawable(Drawable drawable, Runnable runnable)
	{
		super.unscheduleDrawable(drawable, runnable);
	}
}

