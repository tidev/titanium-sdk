/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.view.View;
import android.widget.RelativeLayout;

import ti.modules.titanium.ui.RefreshControlProxy;
import ti.modules.titanium.ui.SearchBarProxy;
import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import ti.modules.titanium.ui.widget.searchview.TiUISearchView;
import ti.modules.titanium.ui.widget.tableview.TiTableView;

public class TiUITableView extends TiUIView
{
	private static final String TAG = "TitaniumTableView";

	private static final int SEARCHVIEW_ID = View.generateViewId();

	protected final TiTableView tableView;
	private TiViewProxy searchProxy;

	public TiUITableView(TiViewProxy proxy)
	{
		super(proxy);

		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;

		this.tableView = new TiTableView((TableViewProxy) proxy);
		setNativeView(tableView);
	}

	public TiTableView getTableView()
	{
		return this.tableView;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_OVER_SCROLL_MODE)) {
			if (Build.VERSION.SDK_INT >= 9) {
				this.tableView.getRecyclerView().setOverScrollMode(
					d.optInt(TiC.PROPERTY_OVER_SCROLL_MODE, View.OVER_SCROLL_ALWAYS));
			}
		}

		if (d.containsKey(TiC.PROPERTY_REFRESH_CONTROL)) {
			Object object = d.get(TiC.PROPERTY_REFRESH_CONTROL);
			if (object instanceof RefreshControlProxy) {
				((RefreshControlProxy) object).assignTo(this.tableView);
			} else if (object == null) {
				RefreshControlProxy.unassignFrom(this.tableView);
			}
		}

		if (d.containsKey(TiC.PROPERTY_SCROLLABLE)) {
			final boolean isScrollable = d.optBoolean(TiC.PROPERTY_SCROLLABLE, true);
			this.tableView.getRecyclerView().setScrollEnabled(isScrollable);
		}

		if (d.containsKey(TiC.PROPERTY_SEARCH)) {
			this.searchProxy = (TiViewProxy) d.get(TiC.PROPERTY_SEARCH);
			final TiUIView search = this.searchProxy.getOrCreateView();

			if (this.searchProxy instanceof SearchBarProxy) {
				((TiUISearchBar) search).setOnSearchChangeListener(tableView);
			} else {
				((TiUISearchView) search).setOnSearchChangeListener(tableView);
			}

			if (d.optBoolean(TiC.PROPERTY_SEARCH_AS_CHILD, true)) {
				final View searchView = search.getNativeView();
				searchView.setId(SEARCHVIEW_ID);

				final RelativeLayout view = new RelativeLayout(proxy.getActivity());

				final RelativeLayout.LayoutParams searchViewLayout = new RelativeLayout.LayoutParams(
					RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
				searchViewLayout.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
				searchViewLayout.addRule(RelativeLayout.ALIGN_PARENT_TOP);
				searchViewLayout.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
				view.addView(searchView, searchViewLayout);

				final RelativeLayout.LayoutParams tableViewLayout = new RelativeLayout.LayoutParams(
					RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT);
				tableViewLayout.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
				tableViewLayout.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
				tableViewLayout.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
				tableViewLayout.addRule(RelativeLayout.BELOW, SEARCHVIEW_ID);
				view.addView(tableView, tableViewLayout);

				setNativeView(view);
			}
		}

		if ((d.containsKey(TiC.PROPERTY_SEPARATOR_STYLE)
			|| d.containsKey(TiC.PROPERTY_SEPARATOR_HEIGHT)
			|| d.containsKey(TiC.PROPERTY_SEPARATOR_COLOR))
			&& this.tableView != null) {
			final Context context = getProxy().getActivity();
			final KrollDict properties = getProxy().getProperties();
			final int style = d.optInt(TiC.PROPERTY_SEPARATOR_STYLE,
				properties.optInt(TiC.PROPERTY_SEPARATOR_STYLE,
					UIModule.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE));
			final int height = style == UIModule.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE
				? TiConvert.toTiDimension(d.optString(TiC.PROPERTY_SEPARATOR_HEIGHT,
					properties.optString(TiC.PROPERTY_SEPARATOR_HEIGHT, "1dp")),
						TiDimension.TYPE_HEIGHT).getAsPixels((View) getNativeView().getParent()) : 0;

			if (d.containsKey(TiC.PROPERTY_SEPARATOR_COLOR)
				|| properties.containsKey(TiC.PROPERTY_SEPARATOR_COLOR)) {
				final int color = TiConvert.toColor(d.optString(TiC.PROPERTY_SEPARATOR_COLOR,
					properties.getString(TiC.PROPERTY_SEPARATOR_COLOR)));

				// Set separator with specified color.
				this.tableView.setSeparator(color, height);

			} else {
				final TypedArray divider = context.obtainStyledAttributes(new int[]{ android.R.attr.listDivider });
				final GradientDrawable defaultDrawable = (GradientDrawable) divider.getDrawable(0);

				// Set platform default separator.
				defaultDrawable.setSize(0, height);
				this.tableView.setSeparator(defaultDrawable);
				divider.recycle();
			}
		}

		if (d.containsKey(TiC.PROPERTY_HEADER_TITLE)
			|| d.containsKey(TiC.PROPERTY_HEADER_VIEW)
			|| d.containsKey(TiC.PROPERTY_FOOTER_TITLE)
			|| d.containsKey(TiC.PROPERTY_FOOTER_VIEW)) {
			this.tableView.update();
		}

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		final KrollDict d = new KrollDict();
		d.put(key, newValue);
		processProperties(d);
	}

	@Override
	public void release()
	{
		if (this.searchProxy != null) {
			searchProxy.releaseViews();
		}

		RefreshControlProxy.unassignFrom(this.tableView);

		this.tableView.release();

		super.release();
	}
}
