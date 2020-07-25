/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;

import ti.modules.titanium.ui.widget.tableview.TableViewHolder;

@Kroll.proxy(creatableInModule = UIModule.class,
			 propertyAccessors = { TiC.PROPERTY_HAS_CHECK, TiC.PROPERTY_HAS_CHILD, TiC.PROPERTY_CLASS_NAME,
								   TiC.PROPERTY_LAYOUT, TiC.PROPERTY_LEFT_IMAGE, TiC.PROPERTY_RIGHT_IMAGE,
								   TiC.PROPERTY_TITLE, TiC.PROPERTY_HEADER, TiC.PROPERTY_FOOTER })
public class TableViewRowProxy extends TiViewProxy
{
	private static final String TAG = "TableViewRowProxy";

	public int index;
	public int indexInSection;

	private TableViewHolder holder;
	private List<TiViewProxy> children = new ArrayList<>();

	private class RowView extends TiUIView
	{
		public RowView(TiViewProxy proxy)
		{
			super(proxy);
		}

		// Make `setNativeView` public.
		// When a TableViewHolder recycles, switch to the new holder.
		public void setNativeView(View view)
		{
			super.setNativeView(view);
		}
	}

	public TableViewRowProxy()
	{
		super();
	}

	public TableViewHolder getHolder()
	{
		return this.holder;
	}

	public void setHolder(TableViewHolder holder)
	{
		this.holder = holder;

		// Update to new holder.
		final RowView row = (RowView) getOrCreateView();
		if (row != null) {
			row.setNativeView(this.holder.getView());

			// Register touch events.
			row.registerForTouch();

			// Grab latest `nativeView`.
			final View nativeView = row.getNativeView();
			nativeView.setAlpha(1.0f);

			row.processProperties(this.properties);

			// Apply ripple effect.
			final Drawable background = generateRippleDrawable(nativeView.getBackground());
			nativeView.setBackground(background);

			// TODO: Implement native item selection.
			// Create a new selector using new background.
			/*final StateListDrawable selector = new StateListDrawable();
			selector.addState(new int[] { android.R.attr.state_activated }, new ColorDrawable(Color.BLUE));
			selector.addState(new int[] {}, nativeView.getBackground());
			nativeView.setBackground(selector);*/
		}
	}

	protected Drawable generateRippleDrawable(Drawable drawable)
	{
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			if (!(drawable instanceof RippleDrawable)) {
				final int[][] rippleStates = new int[][] { new int[] { android.R.attr.state_pressed } };
				final TypedValue typedValue = new TypedValue();
				final TypedArray colorControlHighlight = getActivity().obtainStyledAttributes(
					typedValue.data, new int[] { android.R.attr.colorControlHighlight });
				final int colorControlHighlightInt = colorControlHighlight.getColor(0, 0);
				final int[] rippleColors = new int[] { colorControlHighlightInt };
				final ColorStateList colorStateList = new ColorStateList(rippleStates, rippleColors);

				// Create the RippleDrawable.
				drawable = new RippleDrawable(colorStateList, drawable, null);
			}
		}
		return drawable;
	}

	public void invalidate()
	{
		if (this.holder != null) {
			this.holder.bind(this, this.holder.itemView.isActivated());
			this.holder.itemView.invalidate();
		}
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		for (TiViewProxy child : this.children) {
			child.setActivity(activity);
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new RowView(this);
	}

	@Override
	public TiViewProxy[] getChildren()
	{
		return this.children.toArray(new TiViewProxy[this.children.size()]);
	}

	@Override
	public void add(Object args)
	{
		if (args == null) {
			Log.w(TAG, "add() called with null parameter.");
			return;
		}
		if (args instanceof Object[]) {
			for (Object arg : (Object[]) args) {
				if (arg instanceof TiViewProxy) {
					add(arg);
				} else {
					Log.w(TAG, "add() called with unsupported array object: " + arg.getClass().getSimpleName());
				}
			}
		} else if (args instanceof TiViewProxy) {
			TiViewProxy view = (TiViewProxy) args;
			this.children.add(view);
			view.setParent(this);

		} else {
			Log.w(TAG, "add() called with unsupported argument type: " + args.getClass().getSimpleName());
		}
	}

	@Override
	public void remove(TiViewProxy child)
	{
		if (child == null) {
			Log.w(TAG, "remove() called with null parameter.");
			return;
		}

		this.children.remove(child);
	}

	@Override
	public KrollDict getRect()
	{
		View view = null;
		if (this.holder != null) {
			view = this.holder.itemView;
		}
		return getViewRect(view);
	}

	public TableViewProxy getTableViewProxy()
	{
		TiViewProxy parent = getParent();
		while (!(parent instanceof TableViewProxy) && parent != null) {
			parent = parent.getParent();
		}
		return (TableViewProxy) parent;
	}

	private void processProperty(String name, Object value)
	{
		if (name.equals(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)) {
			Log.w(TAG, "selectedBackgroundColor is deprecated, use backgroundSelectedColor instead.");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR, value);
		}
		if (name.equals(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE)) {
			Log.w(TAG, "selectedBackgroundImage is deprecated, use backgroundSelectedImage instead.");
			setProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, value);
		}
		if (!properties.containsKeyAndNotNull(TiC.PROPERTY_COLOR)) {
			if (name.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {

				// Attempt define text color to create contrast from background color.
				int color = TiColorHelper.parseColor((String) value);
				if (Math.abs(color - Color.WHITE) < Math.abs(color - Color.BLACK)) {
					setProperty(TiC.PROPERTY_COLOR, "black");
				} else {
					setProperty(TiC.PROPERTY_COLOR, "white");
				}
			} else {
				setProperty(TiC.PROPERTY_COLOR, "white");
			}
		}
	}

	@Override
	public void setProperty(String name, Object value)
	{
		super.setProperty(name, value);

		processProperty(name, value);
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);

		processProperty(name, value);
		invalidate();
	}

	@Override
	public boolean fireEvent(String eventName, Object data, boolean bubbles)
	{
		// Inject row data into events.
		TableViewProxy tableViewProxy = getTableViewProxy();
		if (tableViewProxy != null && data instanceof HashMap) {
			final KrollDict payload = new KrollDict((HashMap<String, Object>) data);

			payload.put(TiC.PROPERTY_ROW_DATA, properties);
			if (getParent() instanceof TableViewSectionProxy) {
				payload.put(TiC.PROPERTY_SECTION, getParent());
			}
			payload.put(TiC.EVENT_PROPERTY_ROW, this);
			payload.put(TiC.EVENT_PROPERTY_INDEX, index);
			payload.put(TiC.EVENT_PROPERTY_DETAIL, false);
			data = payload;
		}

		return super.fireEvent(eventName, data, bubbles);
	}

	@Override
	public void releaseViews()
	{
		this.holder = null;

		final KrollDict properties = getProperties();
		if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final TiViewProxy header = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);
			header.releaseViews();
		}
		if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final TiViewProxy footer = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);
			footer.releaseViews();
		}

		for (TiViewProxy child : this.children) {
			child.releaseViews();
		}

		super.releaseViews();
	}

	@Override
	public void release()
	{
		releaseViews();
		this.children.clear();

		super.release();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewRow";
	}
}
