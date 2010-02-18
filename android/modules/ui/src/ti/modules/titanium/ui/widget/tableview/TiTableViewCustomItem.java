/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.json.JSONException;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

public class TiTableViewCustomItem extends TiBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;
	private RowView rowView;

	class RowView extends TiCompositeLayout
	{
		private String lastTouchedViewName;
		private Drawable hasMoreDrawable;

		class DisplayItem
		{
			public String name;
			public TiCompositeLayout.LayoutParams params;
			public String type;

			public DisplayItem() {
				params = new LayoutParams();
			}
		}

		private Drawable defaultBackground;

		public boolean providesSelector;

		private HashMap<String,WeakReference<? extends View>> viewCache;

		public RowView(Context context)
		{
			super(context);

			LayoutParams p = (LayoutParams) generateDefaultLayoutParams();
			p.optionZIndex = Integer.MIN_VALUE;
			setLayoutParams(p);
			setPadding(0, 0, 0, 0);
			setVerticalFadingEdgeEnabled(true);
			defaultBackground = getBackground();
			viewCache = new HashMap<String, WeakReference<? extends View>>(4);
		}

		private TiDict layoutDataForName(String name, TiDict item)
			throws JSONException
		{
			TiDict layout = null;

			if (item != null) {
				TiDict[] rowLayout = (TiDict[]) item.get("layout");
				if (rowLayout != null) {
					for(int i = 0; i < rowLayout.length; i++) {
						TiDict row = rowLayout[i];
						if (row.containsKey("name")) {
							String n = row.getString("name");
							if (n.equals(name)) {
								layout = row;
								break;
							}
						}
					}
				}
			}

			return layout;
		}

		private String resolveString(String key, TiDict item, TiDict template)
			throws JSONException
		{
			String value = null;

			if (item != null && item.containsKey(key)) {
				value = item.getString(key);
			} else {
				value = template.optString(key, null);
			}

			return value;
		}

		private Integer resolveInteger(String key, TiDict item, TiDict template)
		{
			Integer value = null;

			if (item != null && item.containsKey(key)) {
				if (!item.isNull(key)) {
					value = item.getInt(key);
				}
			} else if (template != null && template.containsKey(key)) {
				if (!template.isNull(key)) {
					value = template.getInt(key);
				}
			}

			return value;
		}

		private ArrayList<DisplayItem> resolveDisplayItems(TiDict template, TiDict data)
		{
			ArrayList<DisplayItem> items = new ArrayList<DisplayItem>(5);
			try {
				HashSet<String> names = new HashSet<String>();

				TiDict[] rowLayout = null;

				if (template != null) {
					rowLayout = (TiDict[]) template.get("layout");
					if (rowLayout != null) {
						for(int i = 0; i < rowLayout.length; i++) {
							TiDict row = rowLayout[i];
							if (row.containsKey("name")) {
								String name = row.getString("name");
								names.add(name);
							}
						}
					}
				}

				rowLayout = (TiDict[]) data.get("layout");
				if (rowLayout != null) {
					for(int i = 0; i < rowLayout.length; i++) {
						TiDict row = rowLayout[i];
						if (row.containsKey("name")) {
							String name = row.getString("name");
							names.add(name);
						}
					}
				}

				// Now we have the set of displayable item names.

				int i = 0;

				for(String name : names) {
					TiDict tLayout = layoutDataForName(name, template);
					TiDict rLayout = layoutDataForName(name, data);

					DisplayItem d = new DisplayItem();
					d.name = name;
					d.type = resolveString("type", rLayout, tLayout);

					d.params.optionBottom = resolveInteger("bottom", rLayout, tLayout);
					d.params.optionTop = resolveInteger("top", rLayout, tLayout);
					d.params.optionLeft = resolveInteger("left", rLayout, tLayout);
					d.params.optionRight = resolveInteger("right", rLayout, tLayout);
					d.params.optionWidth = resolveInteger("width", rLayout, tLayout);
					d.params.optionHeight = resolveInteger("height", rLayout, tLayout);
					d.params.optionZIndex = resolveInteger("zIndex", rLayout, tLayout);
					//d.params.index = i++;

					items.add(d);
				}

			} catch (JSONException e) {
				Log.e(LCAT, "Error computing display items: " + e.getMessage(), e);
			}

			return items;
		}

		public void setRowData(TiTableViewItemOptions defaults, TiDict template, TiDict data)
		{
			lastTouchedViewName = null;
			setTag(null);
			removeAllViews(); // consider detaching and reusing, versus dumping.
			if (!data.optBoolean("hasChild", false) && hasMoreDrawable != null) {
				hasMoreDrawable = null; // If this row doesn't need the drawable ditch it.
			}

			TiFileHelper tfh = new TiFileHelper(getContext());

			ArrayList<DisplayItem> items = resolveDisplayItems(template, data);
			int rowHeight = defaults.resolveIntOption("rowHeight", data, template);
			setMinimumHeight(rowHeight);

			providesSelector = false;

			int displayedItems = 0;

			for(DisplayItem item : items) {
				try {
					if (data.containsKey(item.name)) {
						TiDict tLayout = layoutDataForName(item.name, template);
						TiDict rLayout = layoutDataForName(item.name, data);

						View v = null;
						WeakReference<? extends View> weakView = viewCache.get(item.name);
						View cv = weakView == null ? null : weakView.get();

						if (item.type.equals("text")) {
							TextView tv = null;

							if (cv == null) {
								tv = new TextView(getContext());
								viewCache.put(item.name, new WeakReference<View>(tv));
							} else if (cv.getClass() != TextView.class) {
									viewCache.remove(item.name);
									tv = new TextView(getContext());
									viewCache.put(item.name, new WeakReference<View>(tv));
							} else {
								tv = (TextView) cv;
							}

							tv.setTag(item.name);
							tv.setPadding(0, 0, 0, 0);
							tv.setGravity(Gravity.CENTER_VERTICAL);

							tv.setText(data.getString(item.name));
							 //TODO font
							TiUIHelper.styleText(tv,"",
									defaults.resolveOption("fontSize", rLayout, tLayout),
									defaults.resolveOption("fontWeight", rLayout, tLayout));

							String value = null;

							int halign = Gravity.LEFT;
							int valign = Gravity.CENTER_VERTICAL;

							value = defaults.resolveOption("textAlign", rLayout, tLayout);
							if (value != null) {
								if (value.equals("left")) {
									halign = Gravity.LEFT;
								} else if (value.equals("center")) {
									halign = Gravity.CENTER_HORIZONTAL;
								} else if (value.equals("right")) {
									halign = Gravity.RIGHT;
								}
							}

							tv.setGravity(halign | valign);

							value = defaults.resolveOption("backgroundColor", rLayout, tLayout);
							if (value != null) {
								tv.setBackgroundColor(TiConvert.toColor(value));
							}
							value = defaults.resolveOption("color", rLayout, tLayout);
							if (value != null) {
								tv.setTextColor(TiConvert.toColor(value));
							}

							v = tv;
						} else if (item.type.equals("image")) {

							String path = data.getString(item.name);
							Drawable d = tfh.loadDrawable(path, false);
							if (d != null) {
								ImageView iv = null;

								if (cv == null) {
									iv = new ImageView(getContext());;
									viewCache.put(item.name, new WeakReference<View>(iv));
								} else if (cv.getClass() != ImageView.class) {
										viewCache.remove(item.name);
										iv = new ImageView(getContext());
										viewCache.put(item.name, new WeakReference<View>(iv));
								} else {
									iv = (ImageView) cv;
								}

								BitmapDrawable b = (BitmapDrawable) d;
								if (b.getBitmap().getHeight() > rowHeight) {
									//TODO proportional scale
									d = new BitmapDrawable(Bitmap.createScaledBitmap(b.getBitmap(), rowHeight, rowHeight, true));
								}
								iv.setPadding(0, 0, 0, 0);
								iv.setImageDrawable(d);

								v = iv;
							}
						} else {
							Log.w(LCAT, "Data item type not supported: " + item.type);
						}

						if (v != null) {
							v.setTag(item.name);
							displayedItems++;
							addView(v, item.params);
						}
					}
				} catch (JSONException e) {
					Log.e(LCAT, "Error while processing item with name: " + item.name);
				}
			}
			if (displayedItems > 0) {
				String backgroundColor = defaults.resolveOption("backgroundColor", data, template);
				String backgroundSelectedColor = defaults.resolveOption("selectedBackgroundColor", data, template);
				String backgroundImage = defaults.resolveOption("backgroundImage", data, template);
				String backgroundSelectedImage = defaults.resolveOption("selectedBackgroundImage", data, template);
				String backgroundFocusedImage = defaults.resolveOption("focusedBackgroundImage", data, template);

				StateListDrawable sld = TiUIHelper.buildBackgroundDrawable(getContext(), backgroundColor, backgroundSelectedColor, backgroundImage, backgroundSelectedImage, backgroundFocusedImage);
				if (sld != null) {
					setBackgroundDrawable(sld);
					providesSelector = true;
				}

				if (data.optBoolean("hasChild", false)) {
					hasMoreDrawable = createHasChildDrawable();
				}
			} else {
				String backgroundImage = defaults.resolveOption("backgroundImage", data, template);
				if (backgroundImage != null) {
					setBackgroundDrawable(tfh.loadDrawable(backgroundImage, false));
				} else {
					setBackgroundDrawable(defaultBackground);
				}
				providesSelector = false;
			}
		}

		@Override
		public void draw(Canvas canvas) {
			if (hasMoreDrawable != null) {
				int width = getWidth();
				int height = getHeight();

				int w = hasMoreDrawable.getIntrinsicWidth();
				int h = hasMoreDrawable.getIntrinsicHeight();

				int left = Math.max(width - w - 4, 0);
				int top = Math.max(height/2 - h/2, 0);

				hasMoreDrawable.setBounds(left, top, left + w, top + h);
				hasMoreDrawable.draw(canvas);
			}
			super.draw(canvas);
		}

		@Override
		public boolean dispatchTouchEvent(MotionEvent ev) {
			if (ev.getAction() == MotionEvent.ACTION_DOWN) {
				int x = (int) ev.getX();
				int y = (int) ev.getY();

				lastTouchedViewName = null;
				Rect hitRect = new Rect();

				int count = getChildCount();
				for(int i = 0; i < count; i++) {
					View v = getChildAt(i);
					if (v.getVisibility() == View.VISIBLE) {
						v.getHitRect(hitRect);
						if (hitRect.contains(x, y)) {
							lastTouchedViewName = (String) v.getTag();
							if (DBG) {
								Log.i(LCAT, "View touched: " + lastTouchedViewName);
							}
						}
  					}
				}
			}

			return super.dispatchTouchEvent(ev);
		}
	}

	public TiTableViewCustomItem(Context context)
	{
		super(context);

		rowView = new RowView(context);
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
	}

	public void setRowData(TiTableViewItemOptions defaults, TiDict template, TiDict data) {
		rowView.setRowData(defaults, template, data);
	}

	@Override
	public boolean providesOwnSelector() {
		return rowView.providesSelector;
	}

	@Override
	public String getLastClickedViewName() {
		return rowView.lastTouchedViewName;
	}



}
