/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

public class TiUIRelativeLayout extends RelativeLayout
{
	public TiUIRelativeLayout(Context context, AttributeSet set)
	{
		super(context, set);
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		// Call super to obtain child measurements.
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);

		// `match_parent` specified, address issue where parent is not calculated correctly.
		if (getLayoutParams().height == LayoutParams.MATCH_PARENT) {
			final ViewGroup parent = (ViewGroup) getParent();
			int height = 0;

			// Iterate through child views to obtain maximum height.
			for (int i = 0; i < parent.getChildCount(); i++) {
				final View child = parent.getChildAt(i);
				if (child.getVisibility() != GONE) {
					height = Math.max(height, child.getMeasuredHeight());
				}
			}

			// Maximum height found, set new height.
			if (height > 0) {
				heightMeasureSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY);

				// Specify new measure specification.
				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}
		}
	}
}
