/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;
import android.os.Parcelable;
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
import androidx.recyclerview.widget.LinearSnapHelper;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.SnapHelper;

import ti.modules.titanium.ui.widget.TiSwipeRefreshLayout;
import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar.OnSearchChangeListener;

public class TiListView extends TiSwipeRefreshLayout implements OnSearchChangeListener
{
	private static final String TAG = "TiListView";

	private final ListViewAdapter adapter;
	private final DividerItemDecoration decoration;
	private final List<ListItemEntry> items = new ArrayList<>(128);
	private final ListViewProxy proxy;
	private final TiNestedRecyclerView recyclerView;
	private final List<KrollDict> selectedItems = new ArrayList<>();
	private final ItemTouchHelper itemTouchHelper;

	private boolean hasLaidOutChildren = false;
	private boolean hasPopulatedItems = false;
	private SnapHelper snapHelper = null;
	private SelectionTracker tracker = null;
	private boolean isScrolling = false;
	private boolean continuousUpdate = false;
	private boolean forceUpdate = false;
	private int lastScrollDeltaY;
	private int scrollOffsetX = 0;
	private int scrollOffsetY = 0;
	private int lastVisibleItem = -1;
	private int lastVisibleSection = -1;
	private String filterQuery;

	public TiListView(ListViewProxy proxy)
	{
		super(proxy.getActivity());

		this.proxy = proxy;

		this.recyclerView = new TiNestedRecyclerView(getContext());
		this.recyclerView.setFocusable(true);
		this.recyclerView.setFocusableInTouchMode(true);
		this.recyclerView.setBackgroundColor(Color.TRANSPARENT);
		this.recyclerView.setLayoutManager(new LinearLayoutManager(getContext()) {
			@Override
			public void onLayoutChildren(RecyclerView.Recycler recycler, RecyclerView.State state)
			{
				super.onLayoutChildren(recycler, state);

				// The first time we load items, load the next 4 offscreen items to get them cached.
				// This helps improve initial scroll performance.
				if (!hasLaidOutChildren && (getChildCount() > 0)) {
					int startIndex = findFirstVisibleItemPosition() + getChildCount();
					int endIndex = Math.min(startIndex + 3, state.getItemCount() - 1);
					for (int index = startIndex; index <= endIndex; index++) {
						recycler.getViewForPosition(index);
					}
					hasLaidOutChildren = true;
				}
			}

			@Override
			public void onLayoutCompleted(RecyclerView.State state)
			{
				super.onLayoutCompleted(state);

				// Process markers after layout.
				proxy.handleMarkers();
			}
		});
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

					if (proxy.hierarchyHasListener(TiC.EVENT_SCROLLEND)) {
						proxy.fireSyncEvent(TiC.EVENT_SCROLLEND, generateScrollPayload());
					}
				}
			}

			@Override
			public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy)
			{
				super.onScrolled(recyclerView, dx, dy);

				// Update scroll offsets.
				scrollOffsetX += dx;
				scrollOffsetY += dy;

				if (dx == 0 && dy == 0) {

					// Not scrolled, skip.
					return;
				}

				if (!isScrolling) {
					isScrolling = true;

					if (proxy.hierarchyHasListener(TiC.EVENT_SCROLLSTART)) {
						proxy.fireSyncEvent(TiC.EVENT_SCROLLSTART, generateScrollPayload());
					}
				}

				// Only fire `scrolling` event upon direction change.
				if (proxy.hierarchyHasListener(TiC.EVENT_SCROLLING)
					&& ((lastScrollDeltaY >= 0 && dy <= 0 || lastScrollDeltaY <= 0 && dy >= 0) || continuousUpdate)) {
					final KrollDict payload = generateScrollPayload();

					// Determine scroll direction.
					if (dy > 0) {
						payload.put(TiC.PROPERTY_DIRECTION, "up");
					} else if (dy < 0) {
						payload.put(TiC.PROPERTY_DIRECTION, "down");
					} else {
						payload.put(TiC.PROPERTY_DIRECTION, "unknown");
					}
					payload.put(TiC.EVENT_PROPERTY_VELOCITY, 0);
					if (continuousUpdate) {
						if (lastVisibleItem != TiConvert.toInt(payload.get(TiC.PROPERTY_FIRST_VISIBLE_ITEM_INDEX))
							|| lastVisibleSection
								   != TiConvert.toInt(payload.get(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX))
							|| forceUpdate) {
							proxy.fireSyncEvent(TiC.EVENT_SCROLLING, payload);
							lastVisibleItem = TiConvert.toInt(payload.get(TiC.PROPERTY_FIRST_VISIBLE_ITEM_INDEX));
							lastVisibleSection = TiConvert.toInt(payload.get(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX));
						}
					} else {
						proxy.fireSyncEvent(TiC.EVENT_SCROLLING, payload);
					}
				}

				lastScrollDeltaY = dy;

				// Process markers.
				proxy.handleMarkers();
			}
		});

		// Disable list animations.
		this.recyclerView.setItemAnimator(null);

		// Disable cache since it creates cached holder dynamically, which causes stutter on initial scroll.
		// We improved it by creating off-screen items on 1st call of onLayoutChildren().
		recyclerView.setItemViewCacheSize(0);

		// Set list separator.
		decoration = new DividerItemDecoration(getContext(), DividerItemDecoration.VERTICAL);
		this.recyclerView.addItemDecoration(decoration);

		// Create list adapter.
		this.adapter = new ListViewAdapter(getContext(), this.items);
		this.recyclerView.setAdapter(this.adapter);

		// Create ItemTouchHelper for swipe-to-delete and move gestures.
		final ItemTouchHandler itemTouchHandler = new ItemTouchHandler(this.adapter, this.proxy, this.recyclerView);
		itemTouchHelper = new ItemTouchHelper(itemTouchHandler);
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

		final SelectionTracker.Builder trackerBuilder = new SelectionTracker.Builder("list_view_selection",
			this.recyclerView,
			new ItemKeyProvider(ItemKeyProvider.SCOPE_CACHED)
			{
				@Nullable
				@Override
				public Object getKey(int position)
				{
					if (position > -1 && position < items.size()) {
						return items.get(position);
					}
					return null;
				}

				@Override
				public int getPosition(@NonNull Object key)
				{
					return (key instanceof ListItemEntry entry) ? getAdapterIndex(entry) : -1;
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
								return holder.getBindingAdapterPosition();
							}

							@Nullable
							@Override
							public Object getSelectionKey()
							{
								final int position = getPosition();

								if (position > -1 && position < items.size()) {
									return items.get(position);
								}
								return null;
							}

							@Override
							public boolean inSelectionHotspot(@NonNull MotionEvent e)
							{
								if (holder.getProxy() != null) {
									final ListItemProxy item = holder.getProxy();

									// Prevent selection of placeholders.
									return !item.isPlaceholder();
								}

								// Returning true allows taps to immediately select this row.
								return true;
							}
						};
					}
					return null;
				}
			},
			StorageStrategy.createLongStorage()
		);

		final KrollDict properties = proxy.getProperties();
		final boolean editing = properties.optBoolean(TiC.PROPERTY_EDITING, false);
		final boolean requiresEditingToMove = properties.optBoolean(TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE, true);
		final boolean allowsSelection = properties.optBoolean(TiC.PROPERTY_ALLOWS_SELECTION_DURING_EDITING, false);
		final boolean allowsMultipleSelection
			= properties.optBoolean(TiC.PROPERTY_ALLOWS_MULTIPLE_SELECTION_DURING_EDITING, false);
		continuousUpdate = properties.optBoolean(TiC.PROPERTY_CONTINUOUS_UPDATE, false);
		forceUpdate = properties.optBoolean("forceUpdates", false);

		if (properties.optBoolean(TiC.PROPERTY_FIXED_SIZE, false)) {
			this.recyclerView.setHasFixedSize(true);
		}
		setSnapping(properties.optBoolean(TiC.PROPERTY_SNAPPING, false));
		if ((editing || !requiresEditingToMove) && allowsSelection) {
			if (allowsMultipleSelection) {
				this.tracker = trackerBuilder.withSelectionPredicate(SelectionPredicates.createSelectAnything())
					.build();
			} else {
				this.tracker = trackerBuilder.withSelectionPredicate(SelectionPredicates.createSelectSingleAnything())
					.build();
			}

			if (this.tracker != null) {
				this.tracker.addObserver(new SelectionTracker.SelectionObserver()
				{
					@Override
					public void onSelectionChanged()
					{
						super.onSelectionChanged();

						selectedItems.clear();

						if (tracker.hasSelection()) {
							final Iterator<ListItemEntry> i = tracker.getSelection().iterator();

							while (i.hasNext()) {
								final ListItemEntry item = i.next();

								if (item.isPlaceholder()) {
									continue;
								}

								final ListSectionProxy section = item.getSection();
								if (section != null) {
									final KrollDict selectedItem = new KrollDict();

									selectedItem.put(TiC.PROPERTY_ITEM_INDEX, section.getListItemIndex(item));
									selectedItem.put(TiC.PROPERTY_SECTION, section);
									selectedItem.put(TiC.PROPERTY_SECTION_INDEX, proxy.getIndexOfSection(section));

									selectedItems.add(selectedItem);

									if (!allowsMultipleSelection) {
										item.getProxy().fireEvent(TiC.EVENT_CLICK, null);
										break;
									}
								}
							}
						}

						if (allowsMultipleSelection) {
							final KrollDict data = new KrollDict();

							data.put(TiC.PROPERTY_SELECTED_ITEMS, selectedItems.toArray(new KrollDict[0]));
							data.put(TiC.PROPERTY_STARTING_ITEM, selectedItems.isEmpty() ? null : selectedItems.get(0));
							proxy.fireEvent(TiC.EVENT_ITEMS_SELECTED, data);
						}
					}
				});
				this.adapter.setTracker(this.tracker);
			}
		}

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
		update(true);
	}

	/**
	 * Generate payload for `scrollstart` and `scrollend` events.
	 *
	 * @return KrollDict
	 */
	public KrollDict generateScrollPayload()
	{
		final ListItemProxy firstVisibleProxy = getFirstVisibleItem();
		final LinearLayoutManager layoutManager = getLayoutManager();
		final KrollDict payload = new KrollDict();

		// Obtain first visible list item view.
		if (firstVisibleProxy != null) {
			payload.put(TiC.PROPERTY_FIRST_VISIBLE_ITEM, firstVisibleProxy);

			// Obtain first visible list item index in section.
			final int firstVisibleItemIndex = firstVisibleProxy.getIndexInSection();
			payload.put(TiC.PROPERTY_FIRST_VISIBLE_ITEM_INDEX, firstVisibleItemIndex);

			// Obtain first visible section proxy.
			final TiViewProxy firstVisibleParentProxy = firstVisibleProxy.getParent();
			if (firstVisibleParentProxy instanceof ListSectionProxy firstVisibleSection) {
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION, firstVisibleSection);

				// Obtain first visible section index.
				final int firstVisibleSectionIndex = proxy.getIndexOfSection(firstVisibleSection);
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX, firstVisibleSectionIndex);
			} else {

				// Could not obtain section, mark as undefined.
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION, null);
				payload.put(TiC.PROPERTY_FIRST_VISIBLE_SECTION_INDEX, -1);
			}

			payload.put(TiC.PROPERTY_TOP, recyclerView.computeVerticalScrollOffset());
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
	 * Get status of child layouts.
	 *
	 * @return Boolean to determine if child layouts are processed.
	 */
	public boolean getHasLaidOutChildren()
	{
		return this.hasLaidOutChildren;
	}

	/**
	 * Get linear layout manager.
	 *
	 * @return LinearLayoutManager
	 */
	public LinearLayoutManager getLayoutManager()
	{
		return (LinearLayoutManager) this.recyclerView.getLayoutManager();
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
	 * Get selected items.
	 *
	 * @return List of selected items.
	 */
	public List<KrollDict> getSelectedItems()
	{
		return this.selectedItems;
	}

	/**
	 * Get current x-axis scroll offset.
	 * NOTE: This is unreliable when items are added/removed.
	 *
	 * @return Integer of scroll offset.
	 */
	public int getScrollOffsetX()
	{
		return this.scrollOffsetX;
	}

	/**
	 * Get current y-axis scroll offset.
	 * NOTE: This is unreliable when items are added/removed.
	 *
	 * @return Integer of scroll offset.
	 */
	public int getScrollOffsetY()
	{
		return this.scrollOffsetY;
	}

	/**
	 * Get selection tracker.
	 *
	 * @return SelectionTracker
	 */
	public SelectionTracker getTracker()
	{
		return this.tracker;
	}

	/**
	 * Obtains adapter index from entry reference.
	 *
	 * @param entry The entry to search for by reference. Can be null.
	 * @return Returns the adapter index position of the given entry. Returns -1 if not in the list.
	 */
	public int getAdapterIndex(ListItemEntry entry)
	{
		if (entry == null) {
			return -1;
		}

		// Use cached index when still valid. Falls back to a linear search otherwise.
		final int index = entry.getAdapterIndex();
		if ((index >= 0) && (index < this.items.size()) && (this.items.get(index) == entry)) {
			return index;
		}
		return this.items.indexOf(entry);
	}

	/**
	 * Obtains adapter index from list item reference.
	 *
	 * @param itemProxy The list item to search for by reference. Can be null.
	 * @return Returns the adapter index position of the given item. Returns -1 if not found.
	 */
	public int getAdapterIndex(ListItemProxy itemProxy)
	{
		return (itemProxy != null) ? getAdapterIndex(itemProxy.getEntry()) : -1;
	}

	/**
	 * Obtain entry from adapter index without creating its item proxy.
	 *
	 * @param index List item adapter index.
	 * @return Entry at specified adapter index.
	 */
	public ListItemEntry getAdapterEntry(int index)
	{
		return this.items.get(index);
	}

	/**
	 * Obtain item from adapter index, creating its proxy if the row was never displayed.
	 *
	 * @param index List item adapter index.
	 * @return Item at specified adapter index.
	 */
	public ListItemProxy getAdapterItem(int index)
	{
		return this.items.get(index).getProxy();
	}

	/**
	 * Obtain first visible list item proxy.
	 *
	 * @return ListItemProxy
	 */
	public ListItemProxy getFirstVisibleItem()
	{
		final LinearLayoutManager layoutManager = getLayoutManager();
		final View firstVisibleView =
			layoutManager.findViewByPosition(layoutManager.findFirstVisibleItemPosition());

		if (firstVisibleView != null) {
			final ListViewHolder firstVisibleHolder =
				(ListViewHolder) recyclerView.getChildViewHolder(firstVisibleView);

			// Obtain first visible list item proxy.
			return firstVisibleHolder.getProxy();
		}

		return null;
	}

	public ListItemProxy getVisibleItemAt(int index)
	{
		final View itemView = getLayoutManager().findViewByPosition(index);

		if (itemView == null) {
			return null;
		}

		// Obtain list item proxy
		return ((ListViewHolder) recyclerView.getChildViewHolder(itemView)).getProxy();
	}

	/**
	 * Obtain last visible list item proxy.
	 *
	 * @return ListItemProxy
	 */
	public ListItemProxy getLastVisibleItem()
	{
		final LinearLayoutManager layoutManager = getLayoutManager();
		final View lastVisibleView =
			layoutManager.findViewByPosition(layoutManager.findLastVisibleItemPosition());

		if (lastVisibleView != null) {
			final ListViewHolder lastVisibleHolder =
				(ListViewHolder) recyclerView.getChildViewHolder(lastVisibleView);

			// Obtain last visible list item proxy.
			return lastVisibleHolder.getProxy();
		}

		return null;
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
		for (ListItemEntry entry : this.items) {
			final ListItemProxy item = entry.peekProxy();
			if (item != null) {
				item.releaseViews();
			}
		}
		this.items.clear();
		this.hasPopulatedItems = false;
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
	 * Starts dragging programmatically.
	 *
	 * @param vHolder The dedicated view holder
	 */
	public void startDragging(RecyclerView.ViewHolder vHolder)
	{
		itemTouchHelper.startDrag(vHolder);
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
	public void update(boolean force)
	{
		final KrollDict properties = this.proxy.getProperties();
		int filterResultsCount = 0;
		final boolean firstUpdate = this.items.size() == 0;

		final boolean hasHeader = properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW);
		final boolean hasFooter = properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);

		String query = properties.optString(TiC.PROPERTY_SEARCH_TEXT, filterQuery);
		filterQuery = query;
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
			addEntry(new ListItemEntry(item));
		}

		// Iterate through sections.
		for (final ListSectionProxy section : this.proxy.getSections()) {
			final KrollDict sectionProperties = section.getProperties();
			final List<ListItemEntry> sectionItems = section.getEntries();

			int filteredIndex = 0;
			for (final ListItemEntry item : sectionItems) {

				// Handle search query. Reads from the raw data item, no proxy is created here.
				if (query != null && !item.isFilterAlwaysInclude()) {
					final String searchableText =
						caseInsensitive ? item.getSearchableTextLower() : item.getSearchableText();
					if (searchableText != null) {
						if (!searchableText.contains(query)) {
							item.setAdapterIndex(-1);
							continue;
						}
					}
				}

				// Update filtered index of item.
				item.setFilteredIndex(query != null ? filteredIndex++ : -1);

				// Add item.
				addEntry(item);
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

				final ListItemEntry entry = new ListItemEntry(item);
				entry.setSection(section);
				addEntry(entry);
			}
		}

		// Add placeholder item for ListView footer.
		if (hasFooter) {
			final ListItemProxy item = new ListItemProxy(true);

			item.getProperties().put(TiC.PROPERTY_FOOTER_TITLE, properties.get(TiC.PROPERTY_FOOTER_TITLE));
			item.getProperties().put(TiC.PROPERTY_FOOTER_VIEW, properties.get(TiC.PROPERTY_FOOTER_VIEW));

			item.setParent(this.proxy);
			addEntry(new ListItemEntry(item));
		}

		// If filtered and no results, fire `noresult` event.
		if (isFiltered() && filterResultsCount == 0) {
			this.proxy.fireEvent(TiC.EVENT_NO_RESULTS, null);
		}

		Parcelable recyclerViewState = recyclerView.getLayoutManager().onSaveInstanceState();

		// Notify adapter of changes on UI thread.
		this.adapter.update(this.items, force);
		this.hasPopulatedItems = true;

		// FIXME: This is not an ideal workaround for an issue where recycled rows that were in focus
		//        lose their focus when the data set changes. There are improvements to be made here.
		//        This can be reproduced when setting a Ti.UI.TextField in the Ti.UI.ListView.headerView for search.
		final Activity activity = TiApplication.getAppCurrentActivity();
		final View previousFocus = activity != null ? activity.getCurrentFocus() : null;

		// The activity may be not available anymore, e.g. when a HTTP request started to update the list, but the containing window
		// was closed before the operation could be completed.
		if (activity == null) {
			return;
		}

		activity.runOnUiThread(new Runnable()
		{
			@Override
			public void run()
			{
				if (previousFocus != null) {
					final View currentFocus = activity != null ? activity.getCurrentFocus() : null;

					if (currentFocus != previousFocus) {

						// Request focus on previous component before dataset changed.
						previousFocus.requestFocus();
					}
				}

				if (firstUpdate && tracker != null) {
					final boolean editing = properties.optBoolean(TiC.PROPERTY_EDITING, false);
					final boolean requiresEditingToMove =
						properties.optBoolean(TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE, true);

					for (final ListItemEntry item : items) {

						// Re-select previously selected items.
						// This can occur when the theme is changed.
						if (item.isSelected()) {
							if (!editing || requiresEditingToMove) {
								item.getProxy().setSelected(false);
								continue;
							}
							tracker.select(item);
						}
					}
				}

				recyclerView.getLayoutManager().onRestoreInstanceState(recyclerViewState);
			}
		});
	}

	/**
	 * Append entry to the flat adapter list and cache its adapter position on it.
	 */
	private void addEntry(ListItemEntry entry)
	{
		entry.setAdapterIndex(this.items.size());
		this.items.add(entry);
	}

	/**
	 * Refresh the cached adapter position of all entries from the given position onward.
	 */
	private void renumberFrom(int position)
	{
		for (int i = Math.max(position, 0); i < this.items.size(); i++) {
			this.items.get(i).setAdapterIndex(i);
		}
	}

	/**
	 * Determine if a section mutation can be applied to the adapter without rebuilding all items.
	 * Search filtering decides per row whether it is shown, so it always requires a rebuild.
	 */
	private boolean canUpdateIncrementally(ListSectionProxy section)
	{
		if (!this.hasPopulatedItems || (section == null)) {
			return false;
		}
		final KrollDict properties = this.proxy.getProperties();
		if (properties.optString(TiC.PROPERTY_SEARCH_TEXT, this.filterQuery) != null) {
			return false;
		}
		return this.proxy.getIndexOfSection(section) >= 0;
	}

	private static boolean hasHeaderOrFooter(ListSectionProxy section)
	{
		final KrollDict properties = section.getProperties();
		return properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW);
	}

	/**
	 * Determine the adapter position where the first row of the given section goes.
	 * Only valid while not filtering, where every section's rows are contiguous.
	 */
	private int getSectionStartPosition(ListSectionProxy section)
	{
		int position = 0;

		// Skip the ListView's own header placeholder if present.
		if (!this.items.isEmpty()) {
			final ListItemEntry first = this.items.get(0);
			if (first.isPlaceholder() && (first.getSection() == null)) {
				position = 1;
			}
		}

		for (final ListSectionProxy nextSection : this.proxy.getSections()) {
			if (nextSection == section) {
				return position;
			}
			final int itemCount = nextSection.getItemCount();
			if (itemCount > 0) {
				position += itemCount;
			} else if (hasHeaderOrFooter(nextSection)) {
				position += 1;
			}
		}
		return -1;
	}

	/**
	 * Verify that the given entries sit contiguously in the adapter starting at the given position.
	 */
	private boolean isContiguousAt(List<ListItemEntry> entries, int position)
	{
		if ((position < 0) || (position + entries.size() > this.items.size())) {
			return false;
		}
		for (int i = 0; i < entries.size(); i++) {
			if (this.items.get(position + i) != entries.get(i)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Apply an insertion of "count" rows at section index "index" to the adapter.
	 * The section has already been updated.
	 *
	 * @return Returns true if applied. Returns false if the caller must do a full update() instead.
	 */
	public boolean insertSectionItems(ListSectionProxy section, int index, int count)
	{
		if (!canUpdateIncrementally(section) || (count <= 0)) {
			return false;
		}
		final List<ListItemEntry> entries = section.getEntries();
		final int newCount = entries.size();
		final int oldCount = newCount - count;
		if ((index < 0) || (oldCount < 0) || (index > oldCount)) {
			return false;
		}

		// An empty section with a header/footer shows a placeholder row that must be replaced.
		if ((oldCount == 0) && hasHeaderOrFooter(section)) {
			return false;
		}

		// Determine adapter position from the neighbouring rows that are already in the adapter.
		int position;
		if (index + count < newCount) {
			position = getAdapterIndex(entries.get(index + count));
		} else if (index > 0) {
			position = getAdapterIndex(entries.get(index - 1));
			position = (position >= 0) ? position + 1 : -1;
		} else {
			position = getSectionStartPosition(section);
		}
		if ((position < 0) || (position > this.items.size())) {
			return false;
		}

		final List<ListItemEntry> inserted = new ArrayList<>(entries.subList(index, index + count));
		this.items.addAll(position, inserted);
		renumberFrom(position);
		this.adapter.insertModels(position, inserted);

		// Section headers/footers are drawn by the first/last row. Re-bind rows that lost that role.
		if ((oldCount > 0) && hasHeaderOrFooter(section)) {
			if (index == 0) {
				this.adapter.refreshModel(position + count);
			}
			if (index == oldCount) {
				this.adapter.refreshModel(position - 1);
			}
		}
		return true;
	}

	/**
	 * Apply a deletion of the given rows, formerly at section index "index", to the adapter.
	 * The section has already been updated.
	 *
	 * @return Returns true if applied. Returns false if the caller must do a full update() instead.
	 */
	public boolean deleteSectionItems(ListSectionProxy section, int index, List<ListItemEntry> removedEntries)
	{
		if (!canUpdateIncrementally(section) || (removedEntries == null) || removedEntries.isEmpty()) {
			return false;
		}
		final int count = removedEntries.size();
		final int newCount = section.getItemCount();

		// An empty section with a header/footer needs a placeholder row instead.
		if ((newCount == 0) && hasHeaderOrFooter(section)) {
			return false;
		}

		final int position = getAdapterIndex(removedEntries.get(0));
		if (!isContiguousAt(removedEntries, position)) {
			return false;
		}

		this.items.subList(position, position + count).clear();
		for (final ListItemEntry entry : removedEntries) {
			entry.setAdapterIndex(-1);
		}
		renumberFrom(position);
		this.adapter.removeModels(position, count);

		// Section headers/footers are drawn by the first/last row. Re-bind rows that gained that role.
		if ((newCount > 0) && hasHeaderOrFooter(section)) {
			if (index == 0) {
				this.adapter.refreshModel(position);
			}
			if (index == newCount) {
				this.adapter.refreshModel(position - 1);
			}
		}
		return true;
	}

	/**
	 * Apply the replacement of one row to the adapter. The section has already been updated.
	 *
	 * @return Returns true if applied. Returns false if the caller must do a full update() instead.
	 */
	public boolean replaceSectionItem(ListSectionProxy section, ListItemEntry previousEntry, ListItemEntry newEntry)
	{
		if (!canUpdateIncrementally(section) || (previousEntry == null) || (newEntry == null)) {
			return false;
		}
		if (previousEntry == newEntry) {
			return true;
		}
		final int position = getAdapterIndex(previousEntry);
		if (position < 0) {
			return false;
		}

		this.items.set(position, newEntry);
		previousEntry.setAdapterIndex(-1);
		newEntry.setAdapterIndex(position);
		this.adapter.replaceModel(position, newEntry);
		return true;
	}

	/**
	 * Apply the replacement of all rows of a section to the adapter. The section has already been updated.
	 *
	 * @return Returns true if applied. Returns false if the caller must do a full update() instead.
	 */
	public boolean setSectionItems(ListSectionProxy section, List<ListItemEntry> previousEntries)
	{
		if (!canUpdateIncrementally(section) || (previousEntries == null)) {
			return false;
		}
		final List<ListItemEntry> newEntries = section.getEntries();

		// Switching between rows and the empty-section placeholder requires a rebuild.
		if (hasHeaderOrFooter(section) && (previousEntries.isEmpty() != newEntries.isEmpty())) {
			return false;
		}

		int position;
		if (!previousEntries.isEmpty()) {
			position = getAdapterIndex(previousEntries.get(0));
			if (!isContiguousAt(previousEntries, position)) {
				return false;
			}
		} else {
			position = getSectionStartPosition(section);
			if ((position < 0) || (position > this.items.size())) {
				return false;
			}
		}

		if (!previousEntries.isEmpty()) {
			this.items.subList(position, position + previousEntries.size()).clear();
			for (final ListItemEntry entry : previousEntries) {
				entry.setAdapterIndex(-1);
			}
			this.adapter.removeModels(position, previousEntries.size());
		}
		if (!newEntries.isEmpty()) {
			final List<ListItemEntry> inserted = new ArrayList<>(newEntries);
			this.items.addAll(position, inserted);
			this.adapter.insertModels(position, inserted);
		}
		renumberFrom(position);
		return true;
	}

	public void setContinousUpdate(boolean value)
	{
		continuousUpdate = value;
	}

	/**
	 * Enable or disable snapping of items to the nearest position after a scroll.
	 *
	 * @param value Set true to snap items into place.
	 */
	public void setSnapping(boolean value)
	{
		if (value == (this.snapHelper != null)) {
			// Already in the requested state.
			return;
		}

		if (value) {
			this.snapHelper = new LinearSnapHelper();
			this.snapHelper.attachToRecyclerView(this.recyclerView);
		} else {
			this.snapHelper.attachToRecyclerView(null);
			this.snapHelper = null;
		}
	}

	public void setForceUpdates(boolean value)
	{
		forceUpdate = value;
	}

	public void update()
	{
		this.update(false);
	}
}
