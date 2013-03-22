/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.titanium.view.TiCompositeLayout;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.ViewGroup;

public class ListItemLayout extends TiCompositeLayout{

	public ListItemLayout(Context context, AttributeSet set) {
		super(context, set);
	}

	@Override
	public ViewGroup.LayoutParams generateLayoutParams(AttributeSet attrs) {
		LayoutParams params = generateDefaultLayoutParams();
		params.autoFillsWidth = true;
		return params;
	}

}
