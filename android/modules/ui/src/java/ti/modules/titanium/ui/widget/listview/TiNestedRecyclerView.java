/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.NestedScrollingParent;
import androidx.recyclerview.widget.RecyclerView;

public class TiNestedRecyclerView extends RecyclerView implements NestedScrollingParent
{
	private boolean isScrollEnabled = true;

	public TiNestedRecyclerView(@NonNull Context context)
	{
		super(context);

		addOnItemTouchListener(new OnItemTouchListener()
		{
			@Override
			public boolean onInterceptTouchEvent(@NonNull RecyclerView rv, @NonNull MotionEvent e)
			{
				if ((e.getAction() & MotionEvent.ACTION_MASK) == MotionEvent.ACTION_MOVE) {
					return !isScrollEnabled;
				}
				return false;
			}

			@Override
			public void onTouchEvent(@NonNull RecyclerView rv, @NonNull MotionEvent e)
			{
			}

			@Override
			public void onRequestDisallowInterceptTouchEvent(boolean disallowIntercept)
			{
			}
		});
	}

	public TiNestedRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs)
	{
		super(context, attrs);
	}

	public TiNestedRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr)
	{
		super(context, attrs, defStyleAttr);
	}

	public void setScrollEnabled(boolean enabled)
	{
		this.isScrollEnabled = enabled;
	}

	@Override
	public boolean dispatchTouchEvent(MotionEvent ev)
	{
		return super.dispatchTouchEvent(ev);
	}

	@Override
	public boolean onInterceptTouchEvent(MotionEvent e)
	{
		return super.onInterceptTouchEvent(e);
	}

	@Override
	public void onNestedScroll(View target, int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed)
	{
		super.onNestedScroll(target, dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed);
	}

	@Override
	public void onNestedScrollAccepted(View child, View target, int axes)
	{
		super.onNestedScrollAccepted(child, target, axes);
	}

	@Override
	public boolean onStartNestedScroll(View child, View target, int nestedScrollAxes)
	{
		return super.onStartNestedScroll(child, target, nestedScrollAxes);
	}

	@Override
	public void onStopNestedScroll(View child)
	{
		super.onStopNestedScroll(child);
	}
}
