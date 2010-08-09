/*
 *  Android Wheel Control.
 *  http://android-devblog.blogspot.com/2010/05/wheel-ui-contol.html
 *  
 *  Copyright 2010 Yuri Kanivets
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * MODIFICATIONS:
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package kankan.wheel.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.GradientDrawable.Orientation;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.util.AttributeSet;
import android.util.FloatMath;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.View;

/**
 * Numeric wheel view.
 * 
 * @author Yuri Kanivets
 */
public class WheelView extends View {
	/** Current value & label text color */
	private static final int VALUE_TEXT_COLOR = 0xE0000000;

	/** Items text color */
	private static final int ITEMS_TEXT_COLOR = 0xFF000000;

	/** Top and bottom shadows colors */
	private static final int[] SHADOWS_COLORS = new int[] { 0xFF111111,
			0x00AAAAAA, 0x00AAAAAA };

	/** Additional items height (is added to standard text item height) */
	//private static final int ADDITIONAL_ITEM_HEIGHT = 15;
	

	/** Text size */
	//private static final int TEXT_SIZE = 24;
	private int textSize = 24; // default

	/** Top and bottom items offset (to hide that) */
	//private static final int ITEM_OFFSET = TEXT_SIZE / 5;

	/** Additional width for items layout */
	private static final int ADDITIONAL_ITEMS_SPACE = 10;

	/** Label offset */
	private static final int LABEL_OFFSET = 8;

	/** Left and right padding value */
	private static final int PADDING = 10;

	/** Default count of visible items */
	private static final int DEF_VISIBLE_ITEMS = 5;

	// Wheel Values
	private WheelAdapter adapter = null;
	private int currentItem = 0;
	
	// Widths
	private int itemsWidth = 0;
	private int labelWidth = 0;

	// Count of visible items
	private int visibleItems = DEF_VISIBLE_ITEMS;

	// Text paints
	private TextPaint itemsPaint;
	private TextPaint valuePaint;

	// Layouts
	private StaticLayout itemsLayout;
	private StaticLayout labelLayout;
	private StaticLayout valueLayout;

	// Label & background
	private String label;
	private Drawable centerDrawable;

	// Shadows drawables
	private GradientDrawable topShadow;
	private GradientDrawable bottomShadow;

	// Last touch Y position
	private float lastYTouch;
	
	private WheelView.OnItemSelectedListener itemSelectedListener;
	
	private boolean measured = false;

	/**
	 * Constructor
	 */
	public WheelView(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
	}

	/**
	 * Constructor
	 */
	public WheelView(Context context, AttributeSet attrs) {
		super(context, attrs);
	}

	/**
	 * Constructor
	 */
	public WheelView(Context context) {
		super(context);
	}

	/**
	 * Gets wheel adapter
	 * @return the adapter
	 */
	public WheelAdapter getAdapter() {
		return adapter;
	}
	
	/**
	 * Sets whell adapter
	 * @param adapter the new wheel adapter
	 */
	public void setAdapter(WheelAdapter adapter) {
		this.adapter = adapter;
		itemsLayout = null;
		valueLayout = null;
		invalidate();
	}
	
	/**
	 * Gets count of visible items
	 * 
	 * @return the count of visible items
	 */
	public int getVisibleItems() {
		return visibleItems;
	}

	/**
	 * Sets count of visible items
	 * 
	 * @param count
	 *            the new count
	 */
	public void setVisibleItems(int count) {
		visibleItems = count;
		invalidate();
	}

	/**
	 * Gets label
	 * 
	 * @return the label
	 */
	public String getLabel() {
		return label;
	}

	/**
	 * Sets label
	 * 
	 * @param newLabel
	 *            the label to set
	 */
	public void setLabel(String newLabel) {
		label = newLabel;
		labelLayout = null;
		invalidate();
	}

	/**
	 * Gets current value
	 * 
	 * @return the current value
	 */
	public int getCurrentItem() {
		return currentItem;
	}

	/**
	 * Sets the current item
	 * 
	 * @param index the item index
	 */
	public void setCurrentItem(int index) {
		if (index != currentItem) {
			itemsLayout = null;
			valueLayout = null;
			currentItem = index;
			invalidate();
			if (this.itemSelectedListener != null) {
				itemSelectedListener.onItemSelected(this, index);
			}
		}
	}

	/**
	 * Initializes resources
	 */
	private void initResourcesIfNecessary() {
		if (itemsPaint == null) {
			itemsPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG
					| Paint.FAKE_BOLD_TEXT_FLAG);
			//itemsPaint.density = getResources().getDisplayMetrics().density;
			itemsPaint.setTextSize(textSize);
		}

		if (valuePaint == null) {
			valuePaint = new TextPaint(Paint.ANTI_ALIAS_FLAG
					| Paint.FAKE_BOLD_TEXT_FLAG | Paint.DITHER_FLAG);
			//valuePaint.density = getResources().getDisplayMetrics().density;
			valuePaint.setTextSize(textSize);
			valuePaint.setShadowLayer(0.5f, 0, 0.5f, 0xFFFFFFFF);
		}

		if (centerDrawable == null) {
			centerDrawable = getWheelValDrawable(); //getContext().getResources().getDrawable(R.drawable.wheel_val);
		}

		if (topShadow == null) {
			topShadow = new GradientDrawable(Orientation.TOP_BOTTOM, SHADOWS_COLORS);
		}

		if (bottomShadow == null) {
			bottomShadow = new GradientDrawable(Orientation.BOTTOM_TOP, SHADOWS_COLORS);
		}

		//setBackgroundResource(R.drawable.wheel_bg);
		setBackgroundDrawable(getWheelBackground());
	}
	
	/**
	 * Direct programmatic creation of drawables (instead of R & res files)
	 */
	private int dipToInt(float dips) 
	{
		return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dips, getResources().getDisplayMetrics()));
	}
	private GradientDrawable makeGradientDrawable(Orientation orientation, 
			int startColor, int centerColor, int endColor, float strokeDips, int strokeColor)
	{
		GradientDrawable gd = makeGradientDrawable(orientation, startColor, centerColor, endColor);
		gd.setStroke(dipToInt(strokeDips), strokeColor);
		return gd;
	}
	
	private GradientDrawable makeGradientDrawable(Orientation orientation, 
			int startColor, int centerColor, int endColor)
	{
		int[] colors = new int[]{startColor, centerColor, endColor};
		GradientDrawable gd = new GradientDrawable(orientation, colors);
		return gd;
	}
	
	private Drawable getWheelValDrawable()
	{
		return makeGradientDrawable(Orientation.BOTTOM_TOP, 
				Color.parseColor("#70222222"), Color.parseColor("#70222222"), Color.parseColor("#70EEEEEE"), 1f, Color.parseColor("#70333333"));
	}
	
	private Drawable getWheelBackground()
	{
		Drawable item0 = makeGradientDrawable(Orientation.BOTTOM_TOP, Color.parseColor("#333333"), Color.parseColor("#DDDDDD"), Color.parseColor("#333333"), 1f, Color.parseColor("#FF333333"));
		Drawable item1 = makeGradientDrawable(Orientation.BOTTOM_TOP, Color.parseColor("#AAAAAA"), Color.parseColor("#FFFFFF"), Color.parseColor("#AAAAAA"));
		LayerDrawable ld = new LayerDrawable(new Drawable[]{item0, item1});
		ld.setLayerInset(1, dipToInt(4f), dipToInt(1f), dipToInt(4f), dipToInt(1f));
		return ld;
	}

	/**
	 * Calculates desired height for layout
	 * 
	 * @param layout
	 *            the source layout
	 * @return the desired layout height
	 */
	private int getDesiredHeight(Layout layout) {
		if (layout == null) {
			return 0;
		}

		int linecount = layout.getLineCount();
		int desired = layout.getLineTop(linecount) - getItemOffset() * 2
				- getAdditionalItemHeight();

		// Check against our minimum height
		desired = Math.max(desired, getSuggestedMinimumHeight());

		return desired;
	}

	/**
	 * Builds text depending on current value
	 * 
	 * @return the text
	 */
	private String buildText() {
		WheelAdapter adapter = getAdapter();
		StringBuilder itemsText = new StringBuilder();
		int addItems = visibleItems / 2;
		for (int i = currentItem - addItems; i < currentItem; i++) {
			if (i >= 0 && adapter != null) {
				String text = adapter.getItem(i);
				if (text != null) {
					itemsText.append(text);
				}
			}
			itemsText.append("\n");
		}
		
		itemsText.append("\n"); // here will be current value
		
		for (int i = currentItem + 1; i <= currentItem + addItems; i++) {
			if (adapter != null && i < adapter.getItemsCount()) {
				String text = adapter.getItem(i);
				if (text != null) {
					itemsText.append(text);
				}
			}
			if (i < currentItem + addItems) {
				itemsText.append("\n");
			}
		}
		return itemsText.toString();
	}

	/**
	 * Returns the max item length that can be present
	 * @return the max length
	 */
	private int getMaxTextLength() {
		WheelAdapter adapter = getAdapter();
		if (adapter == null) {
			return 0;
		}
		
		int adapterLength = adapter.getMaximumLength();
		if (adapterLength > 0) {
			return adapterLength;
		}

		String maxText = null;
		int addItems = visibleItems / 2;
		for (int i = Math.max(currentItem - addItems, 0);
				i < Math.min(currentItem + visibleItems, adapter.getItemsCount()); i++) {
			String text = adapter.getItem(i);
			if (text != null && (maxText == null || maxText.length() < text.length())) {
				maxText = text;
			}
		}

		return maxText != null ? maxText.length() : 0;
	}

	/**
	 * Calculates control width and creates text layouts
	 * @param widthSize the input layout width
	 * @param mode the layout mode
	 * @return the calculated control width
	 */
	private int calculateLayoutWidth(int widthSize, int mode) {
		initResourcesIfNecessary();

		int width = widthSize;

		int maxLength = getMaxTextLength();
		if (maxLength > 0) {
			float textWidth = FloatMath.ceil(Layout.getDesiredWidth("0", itemsPaint));
			itemsWidth = (int) (maxLength * textWidth);
		} else {
			itemsWidth = 0;
		}
		itemsWidth += ADDITIONAL_ITEMS_SPACE; // make it some more

		labelWidth = 0;
		if (label != null && label.length() > 0) {
			labelWidth = (int) FloatMath.ceil(Layout.getDesiredWidth(label, valuePaint));
		}

		boolean recalculate = false;
		if (mode == MeasureSpec.EXACTLY) {
			width = widthSize;
			recalculate = true;
		} else {
			width = itemsWidth + labelWidth + 2 * PADDING;
			if (labelWidth > 0) {
				width += LABEL_OFFSET;
			}

			// Check against our minimum width
			width = Math.max(width, getSuggestedMinimumWidth());

			if (mode == MeasureSpec.AT_MOST && widthSize < width) {
				width = widthSize;
				recalculate = true;
			}
		}

		if (recalculate) {
			// recalculate width
			int pureWidth = width - LABEL_OFFSET - 2 * PADDING;
			if (pureWidth <= 0) {
				itemsWidth = labelWidth = 0;
			}
			if (labelWidth > 0) {
				double newWidthItems = (double) itemsWidth * pureWidth
						/ (itemsWidth + labelWidth);
				itemsWidth = (int) newWidthItems;
				labelWidth = pureWidth - itemsWidth;
			} else {
				itemsWidth = pureWidth + LABEL_OFFSET; // no label
			}
		}

		if (itemsWidth > 0) {
			createLayouts(itemsWidth, labelWidth);
		}

		return width;
	}

	/**
	 * Creates layouts
	 * @param widthItems width of items layout
	 * @param widthLabel width of label layout
	 */
	private void createLayouts(int widthItems, int widthLabel) {
		if (itemsLayout == null || itemsLayout.getWidth() > widthItems) {
			itemsLayout = new StaticLayout(buildText(), itemsPaint, widthItems,
					widthLabel > 0 ? Layout.Alignment.ALIGN_OPPOSITE : Layout.Alignment.ALIGN_CENTER,
					1, getAdditionalItemHeight(), false);
		} else {
			itemsLayout.increaseWidthTo(widthItems);
		}

		if (valueLayout == null || valueLayout.getWidth() > widthItems) {
			String text = getAdapter() != null ? getAdapter().getItem(currentItem) : null;
			valueLayout = new StaticLayout(text != null ? text : "",
					valuePaint, widthItems, widthLabel > 0 ?
							Layout.Alignment.ALIGN_OPPOSITE : Layout.Alignment.ALIGN_CENTER,
							1, getAdditionalItemHeight(), false);
		} else {
			valueLayout.increaseWidthTo(widthItems);
		}

		if (widthLabel > 0) {
			if (labelLayout == null || labelLayout.getWidth() > widthLabel) {
				labelLayout = new StaticLayout(label, valuePaint,
						widthLabel, Layout.Alignment.ALIGN_NORMAL, 1,
						getAdditionalItemHeight(), false);
			} else {
				labelLayout.increaseWidthTo(widthLabel);
			}
		}
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
		measured = true;
		int widthMode = MeasureSpec.getMode(widthMeasureSpec);
		int heightMode = MeasureSpec.getMode(heightMeasureSpec);
		int widthSize = MeasureSpec.getSize(widthMeasureSpec);
		int heightSize = MeasureSpec.getSize(heightMeasureSpec);

		int width = calculateLayoutWidth(widthSize, widthMode);

		int height;
		if (heightMode == MeasureSpec.EXACTLY) {
			height = heightSize;
		} else {
			height = getDesiredHeight(itemsLayout);

			if (heightMode == MeasureSpec.AT_MOST) {
				height = Math.min(height, heightSize);
			}
		}

		setMeasuredDimension(width, height);
	}

	@Override
	protected void onDraw(Canvas canvas) {
		super.onDraw(canvas);

		if (itemsLayout == null) {
			if (itemsWidth == 0) {
				calculateLayoutWidth(getWidth(), MeasureSpec.EXACTLY);
			} else {
				createLayouts(itemsWidth, labelWidth);
			}
		}

		drawCenterRect(canvas);
		
		if (itemsWidth > 0) {
			canvas.save();
			// Skip padding space and hide a part of top and bottom items
			canvas.translate(PADDING, -getItemOffset());
			drawItems(canvas);
			drawValue(canvas);
			canvas.restore();
		}

		drawShadows(canvas);
	}

	/**
	 * Draws shadows on top and bottom of control
	 * @param canvas the canvas for drawing
	 */
	private void drawShadows(Canvas canvas) {
		topShadow.setBounds(0, 0, getWidth(), getHeight() / visibleItems);
		topShadow.draw(canvas);

		bottomShadow.setBounds(0, getHeight() - getHeight() / visibleItems,
				getWidth(), getHeight());
		bottomShadow.draw(canvas);
	}

	/**
	 * Draws value and label layout
	 * @param canvas the canvas for drawing
	 */
	private void drawValue(Canvas canvas) {
		valuePaint.setColor(VALUE_TEXT_COLOR);
		valuePaint.drawableState = getDrawableState();

		Rect bounds = new Rect();
		itemsLayout.getLineBounds(visibleItems / 2, bounds);

		// draw label
		if (labelLayout != null) {
			canvas.save();
			canvas.translate(itemsLayout.getWidth() + LABEL_OFFSET, bounds.top);
			labelLayout.draw(canvas);
			canvas.restore();
		}

		// draw current value
		canvas.save();
		canvas.translate(0, bounds.top);
		valueLayout.draw(canvas);
		canvas.restore();
	}

	/**
	 * Draws items
	 * @param canvas the canvas for drawing
	 */
	private void drawItems(Canvas canvas) {
		itemsPaint.setColor(ITEMS_TEXT_COLOR);
		itemsPaint.drawableState = getDrawableState();
		itemsLayout.draw(canvas);
	}

	/**
	 * Draws rect for current value
	 * @param canvas the canvas for drawing
	 */
	private void drawCenterRect(Canvas canvas) {
		int center = getHeight() / 2;
		int offset = getHeight() / visibleItems / 2;
		centerDrawable.setBounds(0, center - offset, getWidth(), center + offset);
		centerDrawable.draw(canvas);
	}

	@Override
	public boolean onTouchEvent(MotionEvent event) {
		WheelAdapter adapter = getAdapter();
		if (adapter == null) {
			return true;
		}
		
		switch (event.getAction()) {
		case MotionEvent.ACTION_DOWN:
			lastYTouch = event.getY();
			break;

		case MotionEvent.ACTION_MOVE:
			float delta = event.getY() - lastYTouch;
			int count = (int) (visibleItems * delta / getHeight());
			int pos = currentItem - count;
			pos = Math.max(pos, 0);
			pos = Math.min(pos, adapter.getItemsCount() - 1);
			if (pos != currentItem) {
				lastYTouch = event.getY();
				setCurrentItem(pos);
			}
			break;
		case MotionEvent.ACTION_UP:
			break;
		}
		return true;
	}
	
	public interface OnItemSelectedListener
	{
		void onItemSelected(WheelView view, int index);
	}
	
	public void setItemSelectedListener(OnItemSelectedListener listener)
	{
		this.itemSelectedListener = listener;
	}
	
	private int getAdditionalItemHeight()
	{
		return (int) (textSize * 0.625);
	}
	
	private int getItemOffset()
	{
		return (int) (textSize / 5);
	}
	
	public void setTextSize(int size)
	{
		if (measured) {
			throw new IllegalStateException("Cannot change text size after view has been measured.");
		}
		textSize= size;
	}
	
	public int getTextSize()
	{
		return textSize;
	}
}

