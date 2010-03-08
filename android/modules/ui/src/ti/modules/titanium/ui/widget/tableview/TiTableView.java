/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.AdapterView.OnItemClickListener;

public class TiTableView extends FrameLayout
{

	private static final String LCAT = "TiTableView";
	private static final boolean DBG = TiConfig.LOGD;

	private TableViewModel viewModel;
	private ListView listView;
	private TiTableViewItemOptions defaults;
	private TTVListAdapter adapter;
	private TiDict rowTemplate;
	private OnItemClickedListener itemClickListener;

	private HashMap<String, Integer> rowTypes;
	private AtomicInteger rowTypeCounter;

	private String filterAttribute;
	private String filterText;

	private TiContext tiContext;
	private TableViewProxy proxy;

	public interface OnItemClickedListener {
		public void onClick(TiDict item);
	}

	class TTVListAdapter extends BaseAdapter
	{
		TableViewModel viewModel;
		ArrayList<Integer> index;
		private boolean filtered;

		TTVListAdapter(TableViewModel viewModel) {
			this.viewModel = viewModel;
			this.index = new ArrayList<Integer>(viewModel.getRowCount());
			applyFilter();
		}

		public void applyFilter()
		{
			boolean classChange = false;

			ArrayList<Item> items = viewModel.getViewModel();
			int count = items.size();

			index.clear();
			filtered = false;

			if (filterAttribute != null && filterText != null && filterAttribute.length() > 0 && filterText.length() > 0) {
				filtered = true;

				String lfilter = filterText.toLowerCase();
				for(int i = 0; i < count; i++) {
					boolean keep = true;

					Item item = items.get(i);
					if (!rowTypes.containsKey(item.className)) {
						if (DBG) {
							Log.i(LCAT, "Adding className " + item.className);
						}
						rowTypes.put(item.className, rowTypeCounter.incrementAndGet());
						classChange = true;
					}
// TODO fix filtering
//					if (item.containsKey(filterAttribute)) {
//						String t = item.getString(filterAttribute).toLowerCase();
//						if(t.indexOf(lfilter) < 0) {
//							keep = false;
//						}
//					}

					if (keep) {
						index.add(i);
					}
				}
			} else {
				for(int i = 0; i < count; i++) {

					Item item = items.get(i);
					if (!rowTypes.containsKey(item.className)) {
						if (DBG) {
							Log.i(LCAT, "Adding className " + item.className);
						}
						rowTypes.put(item.className, rowTypeCounter.incrementAndGet());
						classChange = true;
					}

					index.add(i);
				}
			}

			if (classChange) {
				listView.setAdapter(this);
			}
		}

		public int getCount() {
			//return viewModel.getViewModel().length();
			return index.size();
		}

		public Object getItem(int position) {
			return viewModel.getViewModel().get(index.get(position));
		}

		public long getItemId(int position) {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public int getViewTypeCount() {
			Set<String> types = rowTypes.keySet();
			return types.size();
		}

		@Override
		public int getItemViewType(int position) {
			Item o = (Item) getItem(position);
			return typeForItem(o);
		}

		private int typeForItem(Item item) {
			if(!rowTypes.containsKey(item.className)) {
				rowTypes.put(item.className, rowTypeCounter.incrementAndGet());
				if (DBG) {
					Log.i(LCAT, "Adding row class type: " + item.className);
				}
			}
			return rowTypes.get(item.className);
		}

		public View getView(int position, View convertView, ViewGroup parent)
		{
			Item item = (Item) getItem(position);
			TiBaseTableViewItem v = null;

			if (convertView != null) {
				v = (TiBaseTableViewItem) convertView;
				if (!v.getClassName().equals(item.className)) {
					Log.w(LCAT, "Handed a view to convert with className " + v.getClassName() + " expected " + item.className);
					v = null;
				}
			}

			if (v == null) {
				if (item.className.equals(TableViewProxy.CLASSNAME_HEADER)) {
					v = new TiTableViewHeaderItem(tiContext);
					v.setClassName(TableViewProxy.CLASSNAME_HEADER);
				} else if (item.className.equals(TableViewProxy.CLASSNAME_NORMAL)) {
					v = new TiTableViewRowProxyItem(tiContext);
					v.setClassName(TableViewProxy.CLASSNAME_NORMAL);
				} else if (item.className.equals(TableViewProxy.CLASSNAME_DEFAULT)) {
					v = new TiTableViewRowProxyItem(tiContext);
					v.setClassName(TableViewProxy.CLASSNAME_DEFAULT);
				} else {
					v = new TiTableViewRowProxyItem(tiContext);
					v.setClassName(item.className);
				}
			}

			v.setRowData(defaults, item);
			return v;
		}

		@Override
		public boolean areAllItemsEnabled() {
			return false;
		}

		@Override
		public boolean isEnabled(int position) {
			boolean enabled = true;
			Item item = (Item) getItem(position);
			if (item.className.equals(TableViewProxy.CLASSNAME_HEADER)) {
				enabled = false;
			} else {
				enabled = true;
			}
			return enabled;
		}

		@Override
		public boolean hasStableIds() {
			return false;
		}

		@Override
		public void notifyDataSetChanged() {
			applyFilter();
			super.notifyDataSetChanged();
		}

		public boolean isFiltered() {
			return filtered;
		}
	}

	public TiTableView(TiContext tiContext, TableViewProxy proxy)
	{
		super(tiContext.getActivity());

		this.tiContext = tiContext;
		this.proxy = proxy;

		rowTypes = new HashMap<String, Integer>();
		rowTypeCounter = new AtomicInteger(-1);

		rowTypes.put(TableViewProxy.CLASSNAME_HEADER, rowTypeCounter.incrementAndGet());
		rowTypes.put(TableViewProxy.CLASSNAME_NORMAL, rowTypeCounter.incrementAndGet());
		rowTypes.put(TableViewProxy.CLASSNAME_DEFAULT, rowTypeCounter.incrementAndGet());

//TODO bookmark
		this.defaults = new TiTableViewItemOptions();
		defaults.put("rowHeight", "43");
		defaults.put("fontSize", TiUIHelper.getDefaultFontSize(getContext()));
		defaults.put("fontWeight", TiUIHelper.getDefaultFontWeight(getContext()));
		defaults.put("marginLeft", "0");
		defaults.put("marginTop", "0");
		defaults.put("marginRight", "0");
		defaults.put("marginBottom", "0");
		defaults.put("scrollBar", "auto");
		defaults.put("textAlign", "left");

		this.viewModel = new TableViewModel(tiContext, proxy);

		this.listView = new ListView(getContext()) {

			@Override
			public boolean dispatchKeyEvent(KeyEvent event) {
				return super.dispatchKeyEvent(event);
			}
		};
		listView.setId(101);

		final Drawable defaultSelector = listView.getSelector();
		final Drawable adaptableSelector = new ColorDrawable(Color.TRANSPARENT) {

			@Override
			public void draw(Canvas canvas) {
				TiBaseTableViewItem v = (TiBaseTableViewItem) listView.getSelectedView();
				boolean customTable = rowTemplate != null;

				if (customTable || v != null) {
					if (customTable || v.providesOwnSelector()) {
						super.draw(canvas);
					} else {
						Rect r = getBounds();
						defaultSelector.setBounds(r);
						defaultSelector.setState(listView.getDrawableState());
						defaultSelector.draw(canvas);
					}
				} else {
					Rect r = getBounds();
					defaultSelector.setBounds(r);
					defaultSelector.setState(listView.getDrawableState());
					defaultSelector.draw(canvas);
				}
			}

		};
		listView.setSelector(adaptableSelector);

		listView.setFocusable(true);
		listView.setFocusableInTouchMode(true);
		listView.setBackgroundColor(Color.TRANSPARENT);
		listView.setCacheColorHint(Color.TRANSPARENT);
		adapter = new TTVListAdapter(viewModel);
		listView.setAdapter(adapter);

		listView.setOnItemClickListener(new OnItemClickListener() {

			public void onItemClick(AdapterView<?> parent, View view, int position, long id)
			{
				if (itemClickListener != null) {
					TiBaseTableViewItem v = (TiBaseTableViewItem) view;
					String viewClicked = v.getLastClickedViewName();
					Item item = viewModel.getViewModel().get(adapter.index.get(position));
					TiDict event = new TiDict();

					event.put("rowData", item.rowData);
					event.put("section", item.sectionIndex);
					event.put("row", item.indexInSection);
					event.put("index", item.index);
					event.put("detail", false);

					if (viewClicked != null) {
						event.put("layoutName", viewClicked);
					}

					event.put("searchMode", adapter.isFiltered());

					itemClickListener.onClick(event);
				}
			}});

		addView(listView);
	}

	private void dataSetChanged() {
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	public void setOnItemClickListener(OnItemClickedListener listener) {
		this.itemClickListener = listener;
	}

//	public void setData(Object[] rows) {
//		viewModel.setData(rows);
//		dataSetChanged();
//	}

}
