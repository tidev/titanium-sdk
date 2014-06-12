/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.TableViewRowProxy;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.widget.ListView;


public class TiTableViewSelector extends Drawable
{
	private ListView listView;
	private Drawable defaultDrawable;
	private Drawable selectedDrawable;
	private TableViewRowProxy selectedRowProxy;
	private int alpha = 255;
	private boolean dither = false;
	private ColorFilter colorFilter;


	public TiTableViewSelector(ListView listView)
	{
		this.listView = listView;

		defaultDrawable = listView.getSelector();
		selectedDrawable = defaultDrawable;
	}


	@Override
	protected boolean onStateChange(int[] state)
	{
		if (selectedDrawable != null)
		{
			invalidateSelf();
			return true;
		}
		return false;
	}


	public void getRowDrawable(View row)
	{
		if (row instanceof TiTableViewRowProxyItem)
		{
			TiTableViewRowProxyItem rowView = (TiTableViewRowProxyItem) row;
			if (rowView.hasSelector())
			{
				selectedDrawable = rowView.getSelectorDrawable();
				selectedRowProxy = rowView.getRowProxy();

				return;
			}
		}

		selectedDrawable = defaultDrawable;
		selectedRowProxy = null;
	}


	@Override
	public void draw(Canvas canvas)
	{

		Rect currentBounds = getBounds();
		int currentPosition = listView.pointToPosition(currentBounds.centerX(), currentBounds.centerY());

		getRowDrawable(listView.getChildAt(currentPosition - listView.getFirstVisiblePosition()));
		if (selectedDrawable != null) {
			selectedDrawable.setVisible(isVisible(), true);

			if (selectedRowProxy != null) {
				Object opacity = selectedRowProxy.getProperty(TiC.PROPERTY_OPACITY);
				if (opacity != null) {
					selectedDrawable.setAlpha(Math.round(TiConvert.toFloat(opacity) * 255));
				}
			} else {
				selectedDrawable.setAlpha(alpha);
			}

			selectedDrawable.setDither(dither);
			selectedDrawable.setColorFilter(colorFilter);
			selectedDrawable.setState(getState());
			selectedDrawable.setLevel(getLevel());
			selectedDrawable.setBounds(currentBounds);
			selectedDrawable.getCurrent().draw(canvas); // have to use getCurrent() otherwise image can "stick" when
														// state changes
		}
	}


	@Override
	public Drawable getCurrent()
	{
		if (selectedDrawable != null)
		{
			return selectedDrawable;
		}
		return null;
	}


	@Override
	public int getOpacity()
	{
		if (selectedDrawable != null)
		{
			return selectedDrawable.getOpacity();
		}
		return PixelFormat.UNKNOWN;
	}


	@Override
	public void setAlpha(int alpha)
	{
		this.alpha = alpha;
	}


	@Override
	public void setColorFilter(ColorFilter colorFilter)
	{
		this.colorFilter = colorFilter;
	}


	@Override
	public void setDither(boolean dither)
	{
		super.setDither(dither);
		this.dither = dither;
	}
}

