/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.LabelProxy;
import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.widget.TiUILabel;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.view.View;
import android.widget.ImageView;

public class TiTableViewRowProxyItem extends TiBaseTableViewItem
{
	private static final String TAG = "TitaniumTableViewItem";

	private static final int LEFT_MARGIN = 5;
	private static final int RIGHT_MARGIN = 7;

	private BitmapDrawable hasChildDrawable, hasCheckDrawable;
	private ImageView leftImage;
	private ImageView rightImage;
	private TiCompositeLayout content;
	private ArrayList<TiUIView> views;
//	private boolean hasControls;
	private TiDimension height = null;
	private Item item;
	private Object selectorSource;
	private Drawable selectorDrawable;

	public TiTableViewRowProxyItem(Activity activity) {
		super(activity);

		this.handler = new Handler(this);
		this.leftImage = new ImageView(activity);
		leftImage.setVisibility(GONE);
		addView(leftImage, new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));

		this.content = new TiCompositeLayout(activity);
		addView(content, new LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

		this.rightImage = new ImageView(activity);
		rightImage.setVisibility(GONE);
		addView(rightImage, new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
	}

	public TiTableViewRowProxyItem(TiContext tiContext)
	{
		this(tiContext.getActivity());
	}

	protected TableViewRowProxy getRowProxy() {
		return (TableViewRowProxy)item.proxy;
	}

	public void setRowData(Item item) {
		this.item = item;
		TableViewRowProxy rp = getRowProxy();
		rp.setTableViewItem(this);
		setRowData(rp);
	}

	public Item getRowData() {
		return this.item;
	}

	protected TiViewProxy addViewToOldRow(int index, TiUIView titleView, TiViewProxy newViewProxy) {
		Log.w(TAG, newViewProxy + " was added an old style row, reusing the title TiUILabel", Log.DEBUG_MODE);
		LabelProxy label = new LabelProxy();
		label.handleCreationDict(titleView.getProxy().getProperties());
		label.setView(titleView);
		label.setModelListener(titleView);
		titleView.setProxy(label);

		getRowProxy().getControls().add(index, label);
		views.add(newViewProxy.getOrCreateView());
		return label;
	}

	protected void refreshControls()
	{
		ArrayList<TiViewProxy> proxies = getRowProxy().getControls();
		int len = proxies.size();

		if (views == null) {
			views = new ArrayList<TiUIView>(len);
		} else if (views.size() != len) {
			for (TiUIView view : views) {
				View v = view.getNativeView();
				if (v != null && v.getParent().equals(content)) {
					content.removeView(v);
				}
			}
			views = new ArrayList<TiUIView>(len);
		}

		for (int i = 0; i < len; i++) {
			TiUIView view = views.size() > i ? views.get(i) : null;
			TiViewProxy proxy = proxies.get(i);
			if (view != null && view.getProxy() instanceof TableViewRowProxy) {
				proxy = addViewToOldRow(i, view, proxy);
				len++;
			}
			if (view == null) {
				// In some cases the TiUIView for this proxy has been reassigned to another proxy
				// We don't want to actually release it though, just reassign by creating a new view
				view = proxy.forceCreateView();
				clearChildViews(proxy);
				if (i >= views.size()) {
					views.add(view);
				} else {
					views.set(i, view);
				}
			}

			View v = view.getNativeView();
			view.setProxy(proxy);
			view.processProperties(proxy.getProperties());
			applyChildProxies(proxy, view);
			if (v.getParent() == null) {
				content.addView(v, view.getLayoutParams());
			}
		}
	}

	protected void clearChildViews(TiViewProxy parent)
	{
		for (TiViewProxy childProxy : parent.getChildren()) {
			childProxy.setView(null);
			clearChildViews(childProxy);
		}
	}

	protected void applyChildProxies(TiViewProxy viewProxy, TiUIView view)
	{
		int i = 0;
		TiViewProxy childProxies[] = viewProxy.getChildren();
		for (TiUIView childView : view.getChildren()) {
			TiViewProxy childProxy = childProxies[i];
			childView.setProxy(childProxy);
			childView.processProperties(childProxy.getProperties());
			applyChildProxies(childProxy, childView);
			i++;
		}
	}

	protected void refreshOldStyleRow()
	{
		TableViewRowProxy rp = getRowProxy();
		if (!rp.hasProperty(TiC.PROPERTY_TOUCH_ENABLED)) {
			rp.setProperty(TiC.PROPERTY_TOUCH_ENABLED, false);
		}
		if (views == null) {
			views = new ArrayList<TiUIView>();
			views.add(new TiUILabel(rp));
		}
		TiUILabel t = (TiUILabel) views.get(0);
		t.setProxy(rp);
		t.processProperties(filterProperties(rp.getProperties()));
		View v = t.getNativeView();
		if (v.getParent() == null) {
			TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) t.getLayoutParams();
			params.optionLeft = new TiDimension(5, TiDimension.TYPE_LEFT);
			params.optionRight = new TiDimension(5, TiDimension.TYPE_RIGHT);
			params.autoFillsWidth = true;
			content.addView(v, params);
		}
	}

	public void setRowData(TableViewRowProxy rp) {
//		hasControls = rp.hasControls();
		
		Object newSelectorSource = null;
		if (rp.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE)) {
			newSelectorSource = rp.getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE);
		} else if (rp.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)) {
			newSelectorSource = rp.getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR);
		}
		if (newSelectorSource == null || selectorSource != null && !selectorSource.equals(newSelectorSource)) {
			selectorDrawable = null;
		}
		selectorSource = newSelectorSource;
		if (selectorSource != null) {
			rp.getTable().getTableView().getTableView().enableCustomSelector();
		}

		setBackgroundFromProxy(rp);
		// Handle right image
		boolean clearRightImage = true;
		// It's one or the other, check or child.  If you set them both, child's gonna win.
		HashMap props = rp.getProperties();
		if (props.containsKey(TiC.PROPERTY_HAS_CHECK)) {
			if (TiConvert.toBoolean(props, TiC.PROPERTY_HAS_CHECK)) {
				if (hasCheckDrawable == null) {
					hasCheckDrawable = createHasCheckDrawable();
				}
				rightImage.setImageDrawable(hasCheckDrawable);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}
		if (props.containsKey(TiC.PROPERTY_HAS_CHILD)) {
			if (TiConvert.toBoolean(props, TiC.PROPERTY_HAS_CHILD)) {
				if (hasChildDrawable == null) {
					hasChildDrawable = createHasChildDrawable();
				}
				rightImage.setImageDrawable(hasChildDrawable);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}
		if (props.containsKey(TiC.PROPERTY_RIGHT_IMAGE)) {
			String path = TiConvert.toString(props, TiC.PROPERTY_RIGHT_IMAGE);
			String url = rp.resolveUrl(null, path);
			Drawable d = loadDrawable(url);
			if (d != null) {
				rightImage.setImageDrawable(d);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}

		if (clearRightImage) {
			rightImage.setImageDrawable(null);
			rightImage.setVisibility(GONE);
		}

		// Handle left image
		if (props.containsKey(TiC.PROPERTY_LEFT_IMAGE)) {
			String path = TiConvert.toString(props, TiC.PROPERTY_LEFT_IMAGE);
			String url = rp.resolveUrl(null, path);

			Drawable d = loadDrawable(url);
			if (d != null) {
				leftImage.setImageDrawable(d);
				leftImage.setVisibility(VISIBLE);
			}
		} else {
			leftImage.setImageDrawable(null);
			leftImage.setVisibility(GONE);
		}

		if (props.containsKey(TiC.PROPERTY_HEIGHT)) {
			if (!props.get(TiC.PROPERTY_HEIGHT).equals(TiC.SIZE_AUTO)
				&& !props.get(TiC.PROPERTY_HEIGHT).equals(TiC.LAYOUT_SIZE)) {
				height = TiConvert.toTiDimension(TiConvert.toString(props, TiC.PROPERTY_HEIGHT), TiDimension.TYPE_HEIGHT);
			}
		}

		if (props.containsKey(TiC.PROPERTY_LAYOUT)) {
			content.setLayoutArrangement(TiConvert.toString(props, TiC.PROPERTY_LAYOUT));
		}

		if (rp.hasControls()) {
			refreshControls();
		} else {
			refreshOldStyleRow();
		}
	}

	protected boolean hasView(TiUIView view) {
		if (views == null) return false;
		for (TiUIView v : views) {
			if (v == view) {
				return true;
			}
		}
		return false;
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int w = MeasureSpec.getSize(widthMeasureSpec);
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = MeasureSpec.getSize(heightMeasureSpec);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);
		int imageHMargin = 0;

		int leftImageWidth = 0;
		int leftImageHeight = 0;
		if (leftImage != null && leftImage.getVisibility() != View.GONE) {
			measureChild(leftImage, widthMeasureSpec, heightMeasureSpec);
			leftImageWidth = leftImage.getMeasuredWidth();
			leftImageHeight = leftImage.getMeasuredHeight();
			imageHMargin += LEFT_MARGIN;
		}

		int rightImageWidth = 0;
		int rightImageHeight = 0;
		if (rightImage != null && rightImage.getVisibility() != View.GONE) {
			measureChild(rightImage, widthMeasureSpec, heightMeasureSpec);
			rightImageWidth = rightImage.getMeasuredWidth();
			rightImageHeight = rightImage.getMeasuredHeight();
			imageHMargin += RIGHT_MARGIN;
		}

		int adjustedWidth = w - leftImageWidth - rightImageWidth - imageHMargin;
		//int adjustedWidth = w;

		if (content != null) {
			
			// If there is a child view, we don't set a minimum height for the row.
			// Otherwise, we set a minimum height.
			if (((TableViewRowProxy)item.proxy).hasControls()) {
				content.setMinimumHeight(0);
			} else {
				content.setMinimumHeight(48);
			}
			
			measureChild(content, MeasureSpec.makeMeasureSpec(adjustedWidth, wMode), heightMeasureSpec);
			if(hMode == MeasureSpec.UNSPECIFIED) {
				TableViewProxy table = ((TableViewRowProxy)item.proxy).getTable();
				int minRowHeight = -1;
				if (table != null && table.hasProperty(TiC.PROPERTY_MIN_ROW_HEIGHT)) {
					minRowHeight = TiConvert.toTiDimension(TiConvert.toString(table.getProperty(TiC.PROPERTY_MIN_ROW_HEIGHT)), TiDimension.TYPE_HEIGHT).getAsPixels(this);
				}

				if (height == null) {
					h = Math.max(h, Math.max(content.getMeasuredHeight(), Math.max(leftImageHeight, rightImageHeight)));
					h = Math.max(h, minRowHeight);
				} else {
					h = Math.max(minRowHeight, height.getAsPixels(this));
				}
				Log.d(TAG, "Row content measure (" + adjustedWidth + "x" + h + ")", Log.DEBUG_MODE);
				measureChild(content, MeasureSpec.makeMeasureSpec(adjustedWidth, wMode), MeasureSpec.makeMeasureSpec(h, hMode));
			}
		}
		
		setMeasuredDimension(w, Math.max(h, Math.max(leftImageHeight, rightImageHeight)));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		int contentLeft = left;
		int contentRight = right;
		bottom = bottom - top;
		top = 0;

		int height = bottom - top;

		if (leftImage != null && leftImage.getVisibility() != GONE) {
			int w = leftImage.getMeasuredWidth();
			int h = leftImage.getMeasuredHeight();
			int leftMargin = LEFT_MARGIN;

			contentLeft += w + leftMargin;
			int offset = (height - h) / 2;
			leftImage.layout(left+leftMargin, top+offset, left+leftMargin+w, top+offset+h);
		}

		if (rightImage != null && rightImage.getVisibility() != GONE) {
			int w = rightImage.getMeasuredWidth();
			int h = rightImage.getMeasuredHeight();
			int rightMargin = RIGHT_MARGIN;

			contentRight -= w + rightMargin;
			int offset = (height - h) / 2;
			rightImage.layout(right-w-rightMargin, top+offset, right-rightMargin, top+offset+h);
		}

//		if (hasControls) {
//			contentLeft = left + LEFT_MARGIN;
//			contentRight = right - RIGHT_MARGIN;
//		}

		if (content != null) {
			content.layout(contentLeft, top, contentRight, bottom);
		}
	}

	private static String[] filteredProperties = new String[]{
		TiC.PROPERTY_BACKGROUND_IMAGE, TiC.PROPERTY_BACKGROUND_COLOR,
		TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, TiC.PROPERTY_BACKGROUND_SELECTED_COLOR
	};
	private KrollDict filterProperties(KrollDict d) {
		if (d == null) return new KrollDict();
		
		KrollDict filtered = new KrollDict(d);
		for (int i = 0;i < filteredProperties.length; i++) {
			if (filtered.containsKey(filteredProperties[i])) {
				filtered.remove(filteredProperties[i]);
			}
		}
		return filtered;
	}

	@Override
	public boolean hasSelector() {
		KrollDict d = getRowProxy().getProperties();
		TableViewRowProxy rowProxy = getRowProxy();
		return rowProxy.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE)
			|| rowProxy.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR);
	}
	
	@Override
	public Drawable getSelectorDrawable() {
		TableViewRowProxy rowProxy = getRowProxy();
		if (selectorDrawable == null && selectorSource != null) {
			if (rowProxy.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE)) {
				String path = TiConvert.toString(
					rowProxy.getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE));
				String url = rowProxy.resolveUrl(null, path);
				selectorDrawable = loadDrawable(url);
			} else if (rowProxy.hasProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)) {
				int color = TiConvert.toColor(rowProxy.getProperty(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR).toString());
				selectorDrawable = new TiTableViewColorSelector(color);
			}
		}
		return selectorDrawable;
	}
	
	@Override
	public void release() {
		super.release();
		if (views != null) {
			for (TiUIView view : views) {
				view.release();
			}
			views = null;
		}
		if (content != null) {
			content.removeAllViews();
			content = null;
		}
		if (hasCheckDrawable != null) {
			hasCheckDrawable.setCallback(null);
			hasCheckDrawable = null;
		}
		if (hasChildDrawable != null) {
			hasChildDrawable.setCallback(null);
			hasChildDrawable = null;
		}
		
	}
}
