/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import android.graphics.Canvas;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;

public class TiTableViewColorSelector extends ShapeDrawable {
	protected int color;

	public TiTableViewColorSelector(int color) {
		this.color = color;
		setShape(new RectShape());
	}

	@Override
	public void draw(Canvas canvas) {
		getPaint().setColor(this.color);
		super.draw(canvas);
	}
}
