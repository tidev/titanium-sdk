/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import android.graphics.Color;
import android.view.View;
import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;
import ti.modules.titanium.ui.widget.TiSwipeRefreshLayout;
import ti.modules.titanium.ui.widget.listview.TiNestedRecyclerView;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;

public class TiTableView extends TiSwipeRefreshLayout implements OnSearchChangeListener
{
	private static final String TAG = "TiTableView";

	private final TableViewProxy proxy;

	private final List<TableViewRowProxy> rows = new ArrayList<>();
	private final TiNestedRecyclerView recyclerView;
	private final TableViewAdapter adapter;
	private final SelectionTracker tracker = null;

	@Override
	public void filterBy(String query)
	{
		if (query == null || query.isEmpty()) {
			this.adapter.replaceModels(this.rows);
			return;
		}

		final KrollDict properties = proxy.getProperties();
		final boolean caseSensitive = properties.optBoolean(TiC.PROPERTY_FILTER_CASE_INSENSITIVE, true);
		final boolean anchored = properties.optBoolean(TiC.PROPERTY_FILTER_ANCHORED, false);
		final String filterAttribute = properties.optString(TiC.PROPERTY_FILTER_ATTRIBUTE, TiC.PROPERTY_TITLE);
		final List<TableViewRowProxy> filteredRows = new ArrayList<>();

		for (TableViewRowProxy row : this.rows) {
			String attribute = row.getProperties().optString(filterAttribute, null);
			if (attribute != null) {
				if (!caseSensitive) {
					attribute = attribute.toLowerCase();
					query = query.toLowerCase();
				}
				if ((anchored && attribute.startsWith(query)) || (!anchored && attribute.contains(query))) {
					filteredRows.add(row);
				}
			}
		}
		Collections.sort(filteredRows, (row_a, row_b) -> {
			String a = row_a.getProperties().optString(filterAttribute, null);
			String b = row_b.getProperties().optString(filterAttribute, null);

			if (a != null && b != null) {
				return a.compareTo(b);
			}
			return 0;
		});
		this.adapter.replaceModels(filteredRows);
	}

	public TiTableView(TableViewProxy proxy)
	{
		super(proxy.getActivity());

		this.proxy = proxy;

		this.recyclerView = new TiNestedRecyclerView(getContext());
		this.recyclerView.setFocusable(true);
		this.recyclerView.setFocusableInTouchMode(true);
		this.recyclerView.setBackgroundColor(Color.TRANSPARENT);
		this.recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
		this.recyclerView.addItemDecoration(new DividerItemDecoration(getContext(), DividerItemDecoration.VERTICAL));

		this.adapter = new TableViewAdapter(getContext(), this.rows);
		this.recyclerView.setAdapter(this.adapter);

		this.addOnLayoutChangeListener(new OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(View v, int left, int top, int right, int bottom, int oldLeft, int oldTop,
									   int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		});

		// TODO: Implement native item selection.
		/*this.tracker = new SelectionTracker.Builder("table_view_selection",
			this.recyclerView,
			new ItemKeyProvider(1) {
				@Nullable
				@Override
				public Object getKey(int position) {
					return models.get(position);
				}

				@Override
				public int getPosition(@NonNull Object key) {
					return models.indexOf(key);
				}
			},
			new ItemDetailsLookup() {
				@Nullable
				@Override
				public ItemDetails getItemDetails(@NonNull MotionEvent e) {
					final View view = recyclerView.findChildViewUnder(e.getX(), e.getY());
					if (view != null) {
						final TableViewHolder holder = (TableViewHolder) recyclerView.getChildViewHolder(view);
						return new ItemDetails() {
							@Override
							public int getPosition() {
								return holder.getAdapterPosition();
							}

							@Nullable
							@Override
							public Object getSelectionKey() {
								return models.get(getPosition());
							}
						};
					}
					return null;
				}
			},
			StorageStrategy.createLongStorage()
		)
		.withSelectionPredicate(SelectionPredicates.<Long>createSelectSingleAnything())
		.build();
		this.tracker.addObserver(new SelectionTracker.SelectionObserver() {

			@Override
			public void onSelectionChanged() {
				super.onSelectionChanged();

				if (tracker.hasSelection()) {
					final Iterator<TableViewModel> i = tracker.getSelection().iterator();
					while (i.hasNext()) {
						final TableViewModel model = i.next();
						Log.d(TAG, "SELECTED: " + model.title);
					}
				}
			}
		});
		this.adapter.setTracker(this.tracker);*/

		// Disable pull-down refresh support until a Titanium "RefreshControl" has been assigned.
		setSwipeRefreshEnabled(false);

		addView(this.recyclerView);
	}

	public TiNestedRecyclerView getRecyclerView()
	{
		return this.recyclerView;
	}

	public void updateModels()
	{
		for (int i = 0; i < this.rows.size(); i++) {
			final TableViewRowProxy row = this.rows.get(i);
			row.index = i;
		}

		// Notify the adapter of changes.
		this.adapter.notifyDataSetChanged();
	}

	/**
	 * Update
	 */
	public void update()
	{
		// Clear current models.
		this.rows.clear();

		// Iterate through data, processing each supported entry.
		for (final Object view : proxy.getData()) {

			// TableViewRow
			if (view instanceof TableViewRowProxy) {
				final TableViewRowProxy row = (TableViewRowProxy) view;
				this.rows.add(row);

				// TableViewSection
			} else if (view instanceof TableViewSectionProxy) {
				final TableViewSectionProxy section = (TableViewSectionProxy) view;
				final TableViewRowProxy[] rows = section.getRows();

				for (int i = 0; i < rows.length; i++) {
					final TableViewRowProxy row = rows[i];
					row.indexInSection = i;
					this.rows.add(row);
				}
			}
		}

		// Update models.
		updateModels();
	}

	/**
	 * Release models.
	 */
	public void release()
	{
		for (TableViewRowProxy row : this.rows) {
			row.releaseViews();
		}
		this.rows.clear();
	}
}
