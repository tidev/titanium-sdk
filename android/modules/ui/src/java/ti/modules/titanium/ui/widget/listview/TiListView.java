/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;
import android.view.MotionEvent;
import android.view.View;

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
			this.adapter.replaceModels(this.items);
			return;
		}

		final KrollDict properties = proxy.getProperties();
		final boolean caseInsensitive = properties.optBoolean(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);
		final List<ListItemProxy> filteredItems = new ArrayList<>();

		if (caseInsensitive) {

			// Case insensitive, convert query to lower case.
			query = query.toLowerCase();
		}

		for (ListItemProxy item : this.items) {
			String searchableText = item.getProperties().optString(TiC.PROPERTY_SEARCHABLE_TEXT, null);

			if (searchableText != null) {
				if (caseInsensitive) {

					// Case insensitive, convert search text to lower case.
					searchableText = searchableText.toLowerCase();
				}

				if (searchableText.contains(query)) {

					// Found match, include in filtered item list.
					filteredItems.add(item);
				}
			}
		}

		// Sort filtered items.
		Collections.sort(filteredItems, (row_a, row_b) -> {
			final String a = row_a.getProperties().optString(TiC.PROPERTY_SEARCHABLE_TEXT, null);
			final String b = row_b.getProperties().optString(TiC.PROPERTY_SEARCHABLE_TEXT, null);

			if (a != null && b != null) {
				return a.compareTo(b);
			}
			return 0;
		});

		// Update adapter with filtered items.
		this.adapter.replaceModels(filteredItems);
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

	/**
	 * Update list items for adapter.
	 */
	public void update()
	{
		final KrollDict properties = proxy.getProperties();

		final boolean hasHeader = properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
		final boolean hasFooter = properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

		// Clear current items.
		this.items.clear();

		// Add placeholder item for ListView header.
		if (hasHeader) {
			final ListItemProxy item = new ListItemProxy();

			item.getProperties().put(TiC.PROPERTY_HEADER_TITLE, properties.get(TiC.PROPERTY_HEADER_TITLE));
			item.getProperties().put(TiC.PROPERTY_HEADER_VIEW, properties.get(TiC.PROPERTY_HEADER_VIEW));

			this.items.add(item);
		}

		// Iterate through sections.
		for (final ListSectionProxy section : proxy.getSections()) {
			final KrollDict sectionProperties = section.getProperties();
			final List<ListItemProxy> sectionItems = section.getListItems();

			int indexInSection = 0;
			for (final ListItemProxy item : sectionItems) {

				// Update index in section.
				item.indexInSection = indexInSection++;
			}

			final boolean sectionHasHeader = sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
				|| sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
			final boolean sectionHasFooter = sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
				|| sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

			// Allow header and footer to show when no items are present.
			if ((sectionHasHeader || sectionHasFooter) && sectionItems.size() == 0) {
				final ListItemProxy item = new ListItemProxy();

				// Add a placeholder item that will display the section header/footer.
				item.getProperties().put(TiC.PROPERTY_HEADER_TITLE, sectionProperties.get(TiC.PROPERTY_HEADER_TITLE));
				item.getProperties().put(TiC.PROPERTY_HEADER_VIEW, sectionProperties.get(TiC.PROPERTY_HEADER_VIEW));
				item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, sectionProperties.get(TiC.PROPERTY_FOOTER_TITLE));
				item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, sectionProperties.get(TiC.PROPERTY_FOOTER_VIEW));

				this.items.add(item);
			}

			// Add all items.
			this.items.addAll(sectionItems);
		}

		// Add placeholder item for ListView footer.
		if (hasFooter) {
			final ListItemProxy item = new ListItemProxy();

			item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, properties.get(TiC.PROPERTY_FOOTER_TITLE));
			item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, properties.get(TiC.PROPERTY_FOOTER_VIEW));

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
			final KrollDict properties = item.getProperties();

			if (properties.containsKey(TiC.PROPERTY_HEADER_TITLE)
				|| properties.containsKey(TiC.PROPERTY_HEADER_VIEW)
				|| properties.containsKey(TiC.PROPERTY_FOOTER_TITLE)
				|| properties.containsKey(TiC.PROPERTY_FOOTER_VIEW)) {
				continue;
			}

			// Update item index, ignoring header and footer entries.
			item.index = i++;
		}

		// Notify the adapter of changes.
		this.adapter.notifyDataSetChanged();
	}
}
