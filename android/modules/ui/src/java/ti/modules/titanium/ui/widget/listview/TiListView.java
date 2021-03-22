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
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
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
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import ti.modules.titanium.ui.widget.TiSwipeRefreshLayout;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;

public class TiListView extends TiSwipeRefreshLayout implements OnSearchChangeListener
{
	private static final String TAG = "TiListView";

	private static final int CACHE_SIZE = 8;
	private static final int PRELOAD_SIZE = CACHE_SIZE / 2;

	private final ListViewAdapter adapter;
	private final DividerItemDecoration decoration;
	private final List<ListItemProxy> items = new ArrayList<>(CACHE_SIZE);
	private final ListViewProxy proxy;
	private final TiNestedRecyclerView recyclerView;
	private final SelectionTracker tracker;

	private boolean isScrolling = false;
	private int lastScrollDeltaY;
	private String filterQuery;

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

		// Add listener to fire scroll events.
		this.recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener()
		{
			@Override
			public void onScrollStateChanged(@NonNull RecyclerView recyclerView, int newState)
			{
				super.onScrollStateChanged(recyclerView, newState);

				if (isScrolling && newState == RecyclerView.SCROLL_STATE_IDLE) {
					isScrolling = false;
					proxy.fireSyncEvent(TiC.EVENT_SCROLLEND, generateScrollPayload());
				}
			}

			@Override
			public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy)
			{
				super.onScrolled(recyclerView, dx, dy);

				if (dx == 0 && dy == 0) {

					// Not scrolled, skip.
					return;
				}

				if (!isScrolling) {
					isScrolling = true;
					proxy.fireSyncEvent(TiC.EVENT_SCROLLSTART, generateScrollPayload());
				}

				// Only fire `scrolling` event upon direction change.
				if (lastScrollDeltaY >= 0 && dy <= 0 || lastScrollDeltaY <= 0 && dy >= 0) {
					final KrollDict payload = generateScrollPayload();

					// Determine scroll direction.
					if (dy > 0) {
						payload.put(TiC.PROPERTY_DIRECTION, "up");
					} else if (dy < 0) {
						payload.put(TiC.PROPERTY_DIRECTION, "down");
					}
					payload.put(TiC.EVENT_PROPERTY_VELOCITY, 0);
					proxy.fireSyncEvent(TiC.EVENT_SCROLLING, payload);
				}

				lastScrollDeltaY = dy;
			}
		});

		// Disable list animations.
		this.recyclerView.setItemAnimator(null);

		// Optimize scroll performance.
		recyclerView.setItemViewCacheSize(CACHE_SIZE);

		// Set list separator.
		decoration = new DividerItemDecoration(getContext(), DividerItemDecoration.VERTICAL);
		this.recyclerView.addItemDecoration(decoration);

		// Create list adapter.
		this.adapter = new ListViewAdapter(getContext(), this.items);
		this.recyclerView.setAdapter(this.adapter);

		// Create ItemTouchHelper for swipe-to-delete and move gestures.
		final ItemTouchHandler itemTouchHandler = new ItemTouchHandler(this.adapter, this.proxy, this.recyclerView);
		final ItemTouchHelper itemTouchHelper = new ItemTouchHelper(itemTouchHandler);
		itemTouchHelper.attachToRecyclerView(this.recyclerView);

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
		this.filterQuery = query;
		update();
	}

	/**
	 * Generate payload for `scrollstart` and `scrollend` events.
	 *
	 * @return KrollDict
	 */
	public KrollDict generateScrollPayload()
	{
		final KrollDict payload = new KrollDict();
		final LinearLayoutManager layoutManager = (LinearLayoutManager) recyclerView.getLayoutManager();

		// Obtain first visible list item view.
		final View firstVisibleView =
			layoutManager.findViewByPosition(layoutManager.findFirstVisibleItemPosition());
		if (firstVisibleView != null) {
			final ListViewHolder firstVisibleHolder =
				(ListViewHolder) recyclerView.getChildViewHolder(firstVisibleView);

			// Obtain first visible list item proxy.
			final ListItemProxy firstVisibleProxy = (ListItemProxy) firstVisibleHolder.getProxy();
			payload.put(TiC.PROPERTY_FIRST_VISIBLE_ITEM, firstVisibleProxy);

			// Obtain first visible list item index in section.
			final int firstVisibleItemIndex = firstVisibleProxy.getIndexInSection();
			payload.put(TiC.PROPERTY_FIRST_VISIBLE_ITEM_INDEX, firstVisibleItemIndex);

			// Obtain first visible section proxy.
			final TiViewProxy firstVisibleParentProxy = firstVisibleProxy.getParent();
			if (firstVisibleParentProxy instanceof ListSectionProxy) {
				final ListSectionProxy firstVisibleSection = (ListSectionProxy) firstVisibleParentProxy;
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION, firstVisibleSection);

				// Obtain first visible section index.
				final int firstVisibleSectionIndex = proxy.getIndexOfSection(firstVisibleSection);
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX, firstVisibleSectionIndex);
			} else {

				// Could not obtain section, mark as undefined.
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION, null);
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX, -1);
			}
		}

		// Define visible item count.
		final int visibleItemCount =
			layoutManager.findLastVisibleItemPosition() - layoutManager.findFirstVisibleItemPosition();
		payload.put(TiC.PROPERTY_VISIBLE_ITEM_COUNT, visibleItemCount);

		return payload;
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
	 * Obtain item from adapter index.
	 *
	 * @param index List item adapter index.
	 * @return Item at specified adapter index.
	 */
	public ListItemProxy getAdapterItem(int index)
	{
		return this.items.get(index);
	}

	/**
	 * Determine if table results are filtered by query.
	 *
	 * @return Boolean
	 */
	public boolean isFiltered()
	{
		return this.filterQuery != null && !this.filterQuery.isEmpty();
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

		final KrollDict properties = this.proxy.getProperties();
		final boolean shouldPreload = this.items.size() == 0;
		int filterResultsCount = 0;

		final boolean hasHeader = properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
		final boolean hasFooter = properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

		String query = properties.optString(TiC.PROPERTY_SEARCH_TEXT, filterQuery);
		final boolean caseInsensitive = properties.optBoolean(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);
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

			item.setParent(this.proxy);
			this.items.add(item);
		}

		// Iterate through sections.
		for (final ListSectionProxy section : this.proxy.getSections()) {
			final KrollDict sectionProperties = section.getProperties();
			final List<ListItemProxy> sectionItems = section.getListItems();

			int index = 0;
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
				item.index = index++;
				this.items.add(item);
			}
			filterResultsCount += filteredIndex;

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
				item.getProperties().put(TiC.PROPERTY_HEADER_TITLE,
					sectionProperties.get(TiC.PROPERTY_HEADER_TITLE));
				item.getProperties().put(TiC.PROPERTY_HEADER_VIEW,
					sectionProperties.get(TiC.PROPERTY_HEADER_VIEW));
				item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE,
					sectionProperties.get(TiC.PROPERTY_FOOTER_TITLE));
				item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW,
					sectionProperties.get(TiC.PROPERTY_FOOTER_VIEW));

				item.setParent(this.proxy);
				this.items.add(item);
			}
		}

		// Add placeholder item for ListView footer.
		if (hasFooter) {
			final ListItemProxy item = new ListItemProxy(true);

			item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, properties.get(TiC.PROPERTY_FOOTER_TITLE));
			item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, properties.get(TiC.PROPERTY_FOOTER_VIEW));

			item.setParent(this.proxy);
			this.items.add(item);
		}

		// If filtered and no results, fire `noresult` event.
		if (isFiltered() && filterResultsCount == 0) {
			this.proxy.fireEvent(TiC.EVENT_NO_RESULTS, null);
		}

		// Pre-load items of empty list.
		if (shouldPreload) {
			final int preloadSize = Math.min(this.items.size(), PRELOAD_SIZE);

			for (int i = 0; i < preloadSize; i++) {

				// Pre-load views for smooth initial scroll.
				this.items.get(i).getOrCreateView();
			}
		}

		// Notify adapter of changes on UI thread.
		this.adapter.notifyDataSetChanged();

		// FIXME: This is not an ideal workaround for an issue where recycled rows that were in focus
		//        lose their focus when the data set changes. There are improvements to be made here.
		//        This can be reproduced when setting a Ti.UI.TextField in the Ti.UI.ListView.headerView for search.
		final Activity activity = TiApplication.getAppCurrentActivity();
		final View previousFocus = activity != null ? activity.getCurrentFocus() : null;

		if (previousFocus != null) {
			activity.runOnUiThread(new Runnable()
			{
				@Override
				public void run()
				{
					final View currentFocus = activity != null ? activity.getCurrentFocus() : null;

					if (currentFocus != previousFocus) {

						// Request focus on previous component before dataset changed.
						previousFocus.requestFocus();
					}
				}
			});
		}
	}
}
