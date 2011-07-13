/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.util.TiConfig;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.widget.ListView;


public class TiTableViewSelector extends Drawable
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

		// on Android 3.0 and up, the default ListView selector does not correctly 
		// respond to the 0 (off) state and leaves the highlight for a ListView 
		// item "stuck".  Create a default StateListDrawable in order to support the 
		// "off" mode.
		if (Build.VERSION.SDK_INT >= 11)
		{
			defaultDrawable = new StateListDrawable();
			((StateListDrawable) defaultDrawable).addState(new int[] {android.R.attr.state_pressed},  new ColorDrawable(Color.WHITE));
			((StateListDrawable) defaultDrawable).addState(new int[0], new ColorDrawable(Color.TRANSPARENT));
		}
		else
		{
			defaultDrawable = listView.getSelector();
		}
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
		if (!(listView.isInTouchMode()))
		{
			selectedDrawable = getRowDrawable(listView.getSelectedView());
			selectedDrawable.setBounds(getBounds());
		}

		selectedDrawable.draw(canvas);
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
		selectedDrawable.setAlpha(alpha);
	}


	public void setColorFilter(ColorFilter colorFilter)
	{
		selectedDrawable.setColorFilter(colorFilter);
	}
}

