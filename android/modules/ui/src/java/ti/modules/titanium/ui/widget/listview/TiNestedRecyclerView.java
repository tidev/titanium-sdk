/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import android.content.Context;
import android.os.Build;
import android.util.AttributeSet;
import android.view.ContextThemeWrapper;
import android.view.MotionEvent;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.NestedScrollingParent;
import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.titanium.R;

public class TiNestedRecyclerView extends RecyclerView implements NestedScrollingParent
{
	private static final String TAG = "TiNestedRecyclerView";

	private View nestedScrollTarget = null;
	private boolean nestedScrollTargetIsBeingDragged = false;
	private boolean nestedScrollTargetWasUnableToScroll = false;
	private boolean skipTouchInterception = false;

	private boolean isScrollEnabled = true;

	public TiNestedRecyclerView(@NonNull Context context)
	{
		super(new ContextThemeWrapper(context, R.style.RecyclerView));

		addOnItemTouchListener(new OnItemTouchListener()
		{
			@Override
			public boolean onInterceptTouchEvent(@NonNull RecyclerView rv, @NonNull MotionEvent e)
			{
				final int action = e.getAction() & MotionEvent.ACTION_MASK;
				final int scrollState = rv.getScrollState();

				switch (action) {

					case MotionEvent.ACTION_DOWN: {
						if (scrollState == RecyclerView.SCROLL_STATE_SETTLING) {
							rv.stopScroll();
						}
						break;
					}

					case MotionEvent.ACTION_MOVE: {
						if (!isScrollEnabled && scrollState != SCROLL_STATE_IDLE) {
							return true;
						}
						break;
					}
				}

				return false;
			}

			@Override
			public void onTouchEvent(@NonNull RecyclerView rv, @NonNull MotionEvent e) {}

			@Override
			public void onRequestDisallowInterceptTouchEvent(boolean disallowIntercept) {}
		});
	}

	public TiNestedRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs)
	{
		super(new ContextThemeWrapper(context, R.style.RecyclerView), attrs);
	}

	public TiNestedRecyclerView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr)
	{
		super(new ContextThemeWrapper(context, R.style.RecyclerView), attrs, defStyleAttr);
	}

	public void setScrollEnabled(boolean enabled)
	{
		this.isScrollEnabled = enabled;
	}

	@Override
	public boolean dispatchTouchEvent(MotionEvent ev)
	{
		skipTouchInterception = nestedScrollTarget != null;

		boolean handled = super.dispatchTouchEvent(ev);

		skipTouchInterception = false;

		return handled;
	}

	@Override
	public boolean onInterceptTouchEvent(MotionEvent e)
	{
		return super.onInterceptTouchEvent(e) && !skipTouchInterception;
	}

	@Override
	public void onNestedScroll(View target, int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed)
	{
		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT) {
			super.onNestedScroll(target, dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed);
		}

		if (target == nestedScrollTarget && !nestedScrollTargetIsBeingDragged) {
			if (dyConsumed != 0) {
				// The descendant was actually scrolled, so we won't bother it any longer.
				// It will receive all future events until it finished scrolling.
				nestedScrollTargetIsBeingDragged = true;
				nestedScrollTargetWasUnableToScroll = false;

			} else if (dyConsumed == 0 && dyUnconsumed != 0) {
				// The descendant tried scrolling in response to touch movements but was not able to do so.
				// We remember that in order to allow RecyclerView to take over scrolling.
				nestedScrollTargetWasUnableToScroll = true;
				if (target.getParent() != null)
					target.getParent().requestDisallowInterceptTouchEvent(false);
			}
		}
	}

	@Override
	public void onNestedScrollAccepted(View child, View target, int axes)
	{
		if (axes != 0 && View.SCROLL_AXIS_VERTICAL != 0) {
			// A descendant started scrolling, so we'll observe it.
			nestedScrollTarget = target;
			nestedScrollTargetIsBeingDragged = false;
			nestedScrollTargetWasUnableToScroll = false;
		}

		if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT) {
			super.onNestedScrollAccepted(child, target, axes);
		}
	}

	@Override
	public void onNestedPreScroll(View target, int dx, int dy, int[] consumed)
	{
		// Implement abstract method for compatibility with Android 4.4.
	}

	@Override
	public boolean onStartNestedScroll(View child, View target, int nestedScrollAxes)
	{
		return nestedScrollAxes != 0
			&& (Build.VERSION.SDK_INT < 21 || View.SCROLL_AXIS_VERTICAL != 0);
	}

	@Override
	public void onStopNestedScroll(View child)
	{
		nestedScrollTarget = null;
		nestedScrollTargetIsBeingDragged = false;
		nestedScrollTargetWasUnableToScroll = false;
	}
}
