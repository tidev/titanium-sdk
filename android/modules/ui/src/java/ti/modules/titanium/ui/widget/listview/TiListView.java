/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;
import android.view.MotionEvent;
import android.view.View;
import android.os.Handler;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.selection.ItemDetailsLookup;
import androidx.recyclerview.selection.ItemKeyProvider;
import androidx.recyclerview.selection.SelectionPredicates;
import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.selection.StorageStrategy;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;

import ti.modules.titanium.ui.widget.TiSwipeRefreshLayout;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;

public class TiListView extends TiSwipeRefreshLayout implements OnSearchChangeListener
{
	private static final String TAG = "TiListView";

	private static final int CACHE_SIZE = 48;
	private static final int PRELOAD_SIZE = CACHE_SIZE * 2;

	private final ListViewAdapter adapter;
	private final DividerItemDecoration decoration;
	private final List<ListItemProxy> items = new ArrayList<>();
	private final ListViewProxy proxy;
	private final TiNestedRecyclerView recyclerView;
	private final SelectionTracker tracker;

	private boolean isFiltered = false;

	public TiListView(ListViewProxy proxy)
	{
		super(proxy.getActivity());

		this.proxy = proxy;

		this.recyclerView = new TiNestedRecyclerView(getContext());
		this.recyclerView.setFocusable(true);
		this.recyclerView.setFocusableInTouchMode(true);
		this.recyclerView.setBackgroundColor(Color.TRANSPARENT);
		this.recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
		this.recyclerView.setFocusableInTouchMode(false);

		// Disable list animations.
		this.recyclerView.setItemAnimator(null);

		// Optimize scroll performance.
		recyclerView.setItemViewCacheSize(CACHE_SIZE);

		// Set list separator.
		decoration = new DividerItemDecoration(getContext(), DividerItemDecoration.VERTICAL);
		this.recyclerView.addItemDecoration(decoration);

		this.adapter = new ListViewAdapter(getContext(), this.items);
		this.recyclerView.setAdapter(this.adapter);

		// Fire `postlayout` on layout changes.
		this.addOnLayoutChangeListener(new OnLayoutChangeListener()
		{
			@Override
			public void onLayoutChange(View v, int left, int top, int right, int bottom, int oldLeft, int oldTop,
									   int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		});

		// TODO: Implement native item selection.
		this.tracker = new SelectionTracker.Builder("list_view_selection",
			this.recyclerView,
			new ItemKeyProvider(1)
			{
				@Nullable
				@Override
				public Object getKey(int position)
				{
					return items.get(position);
				}

				@Override
				public int getPosition(@NonNull Object key)
				{
					return items.indexOf(key);
				}
			},
			new ItemDetailsLookup()
			{
				@Nullable
				@Override
				public ItemDetails getItemDetails(@NonNull MotionEvent e)
				{
					final View view = recyclerView.findChildViewUnder(e.getX(), e.getY());
					if (view != null) {
						final ListViewHolder holder = (ListViewHolder) recyclerView.getChildViewHolder(view);
						return new ItemDetails()
						{
							@Override
							public int getPosition()
							{
								return holder.getAdapterPosition();
							}

							@Nullable
							@Override
							public Object getSelectionKey()
							{
								return items.get(getPosition());
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
		this.tracker.addObserver(new SelectionTracker.SelectionObserver()
		{

			@Override
			public void onSelectionChanged()
			{
				super.onSelectionChanged();

				/*if (tracker.hasSelection()) {
					final Iterator<ListItemProxy> i = tracker.getSelection().iterator();
					while (i.hasNext()) {
						final ListItemProxy proxy = i.next();

						Log.d(TAG, "SELECTED: " + proxy.getProperties().getString(TiC.PROPERTY_TITLE));
					}
				}*/
			}
		});
		this.adapter.setTracker(this.tracker);

		// Disable pull-down refresh support until a Titanium "RefreshControl" has been assigned.
		setSwipeRefreshEnabled(false);

		addView(this.recyclerView);
	}

	/**
	 * Filter current rows with query string.
	 *
	 * @param query String to query rows with.
	 */
	@Override
	public void filterBy(String query)
	{
		if (query == null || query.isEmpty()) {

			// No query, update adapter with original items.
			update();
			this.isFiltered = false;
			return;
		}

		update(query);
		this.isFiltered = true;
	}

	/**
	 * Get list adapter.
	 *
	 * @return ListViewAdapter
	 */
	public ListViewAdapter getAdapter()
	{
		return this.adapter;
	}

	/**
	 * Get recycler view of table.
	 *
	 * @return TiNestedRecyclerView
	 */
	public TiNestedRecyclerView getRecyclerView()
	{
		return this.recyclerView;
	}

	/**
	 * Obtain row for specified index.
	 *
	 * @param index Index of row.
	 * @return TableViewRowProxy
	 */
	public ListItemProxy getRowByIndex(int index)
	{
		for (ListItemProxy item : this.items) {
			if (item.index == index) {
				return item;
			}
		}
		return null;
	}

	/**
	 * Obtain adapter index from list item index.
	 *
	 * @param index List item index.
	 * @return Integer of adapter index.
	 */
	public int getAdapterIndex(int index)
	{
		for (ListItemProxy item : this.items) {
			if (item.index == index) {
				return this.items.indexOf(item);
			}
		}
		return -1;
	}

	/**
	 * Determine if table results are filtered by query.
	 *
	 * @return Boolean
	 */
	public boolean isFiltered()
	{
		return this.isFiltered;
	}

	/**
	 * Release models.
	 */
	public void release()
	{
		for (ListItemProxy item : this.items) {
			item.releaseViews();
		}
		this.items.clear();
	}

	/**
	 * Set row separator color and height.
	 *
	 * @param color  Color of separator.
	 * @param height Height of separator.
	 */
	public void setSeparator(int color, int height)
	{
		final ShapeDrawable separator = new ShapeDrawable(new RectShape());

		separator.setIntrinsicHeight(height);
		separator.getPaint().setColor(color);
		decoration.setDrawable(separator);

		this.recyclerView.invalidate();
	}

	/**
	 * Set row separator drawable.
	 *
	 * @param drawable Separator drawable.
	 */
	public void setSeparator(Drawable drawable)
	{
		decoration.setDrawable(drawable);
	}

	public void update()
	{
		this.update(null);
	}

	/**
	 * Update list items for adapter.
	 */
	private void update(String query)
	{
		final KrollDict properties = proxy.getProperties();

		final boolean hasHeader = properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
		final boolean hasFooter = properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

		final boolean caseInsensitive = properties.optBoolean(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);

		if (query == null) {
			query = properties.getString(TiC.PROPERTY_SEARCH_TEXT);
		}
		if (query != null && caseInsensitive) {
			query = query.toLowerCase();
		}

		// Clear current items.
		this.items.clear();

		// Add placeholder item for ListView header.
		if (hasHeader) {
			final ListItemProxy item = new ListItemProxy(true);

			item.getProperties().put(TiC.PROPERTY_HEADER_TITLE, properties.get(TiC.PROPERTY_HEADER_TITLE));
			item.getProperties().put(TiC.PROPERTY_HEADER_VIEW, properties.get(TiC.PROPERTY_HEADER_VIEW));

			item.setParent(proxy);
			this.items.add(item);
		}

		// Iterate through sections.
		for (final ListSectionProxy section : proxy.getSections()) {
			final KrollDict sectionProperties = section.getProperties();
			final List<ListItemProxy> sectionItems = section.getListItems();

			int filteredIndex = 0;
			for (final ListItemProxy item : sectionItems) {

				// Handle search query.
				if (query != null) {
					String searchableText = item.getProperties().optString(TiC.PROPERTY_SEARCHABLE_TEXT, null);
					if (searchableText != null) {
						if (caseInsensitive) {
							searchableText = searchableText.toLowerCase();
						}
						if (!searchableText.contains(query)) {
							continue;
						}
					}
				}

				// Update filtered index of item.
				item.setFilteredIndex(query != null ? filteredIndex++ : -1);

				// Add item.
				this.items.add(item);
			}

			// Update section filtered row count.
			section.setFilteredItemCount(query != null ? filteredIndex : -1);

			final boolean sectionHasHeader = sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
				|| sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
			final boolean sectionHasFooter = sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
				|| sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

			// Allow header and footer to show when no items are present.
			if ((sectionHasHeader || sectionHasFooter) && sectionItems.size() == 0) {
				final ListItemProxy item = new ListItemProxy(true);

				// Add a placeholder item that will display the section header/footer.
				item.getProperties().put(TiC.PROPERTY_HEADER_TITLE, sectionProperties.get(TiC.PROPERTY_HEADER_TITLE));
				item.getProperties().put(TiC.PROPERTY_HEADER_VIEW, sectionProperties.get(TiC.PROPERTY_HEADER_VIEW));
				item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, sectionProperties.get(TiC.PROPERTY_FOOTER_TITLE));
				item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, sectionProperties.get(TiC.PROPERTY_FOOTER_VIEW));

				item.setParent(proxy);
				this.items.add(item);
			}
		}

		// Add placeholder item for ListView footer.
		if (hasFooter) {
			final ListItemProxy item = new ListItemProxy(true);

			item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, properties.get(TiC.PROPERTY_FOOTER_TITLE));
			item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, properties.get(TiC.PROPERTY_FOOTER_VIEW));

			item.setParent(proxy);
			this.items.add(item);
		}

		// Pre-load views for smooth initial scroll.
		final int preloadSize = Math.min(this.items.size(), PRELOAD_SIZE);
		for (int i = 0; i < preloadSize; i++) {
			this.items.get(i).getOrCreateView();
		}

		// Update models.
		updateModels();
	}

	/**
	 * Update adapter models.
	 */
	public void updateModels()
	{
		// Amend final index of items.
		int i = 0;
		for (ListItemProxy item : this.items) {
			if (item.isPlaceholder()) {
				continue;
			}

			// Update item index, ignoring placeholder entries.
			item.index = i++;
		}

		final Activity activity = TiApplication.getAppCurrentActivity();
		final View previousFocus = activity != null ? activity.getCurrentFocus() : null;

		// Notify the adapter of changes.
		this.adapter.notifyDataSetChanged();

		// FIXME: This is not an ideal workaround for an issue where recycled items that were in focus
		//        lose their focus when the data set changes. There are improvements to be made here.
		//        This can be reproduced when setting a Ti.UI.TextField in the Ti.UI.ListView.headerView for search.
		new Handler().post(new Runnable()
		{
			public void run()
			{
				final View currentFocus = activity != null ? activity.getCurrentFocus() : null;

				if (previousFocus != null && currentFocus != previousFocus) {

					// Request focus on previous component before dataset changed.
					previousFocus.requestFocus();
				}
			}
		});
	}
}
