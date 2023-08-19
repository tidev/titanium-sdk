/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import static android.util.TypedValue.COMPLEX_UNIT_DIP;

import android.app.Activity;
import android.view.View;

import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.LinearSmoothScroller;
import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.TiConvert;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ListViewScrollPositionModule;
import ti.modules.titanium.ui.widget.TiUIListView;

@Kroll.proxy(
	creatableInModule = ti.modules.titanium.ui.UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_CAN_SCROLL,
		TiC.PROPERTY_CASE_INSENSITIVE_SEARCH,
		TiC.PROPERTY_CONTINUOUS_UPDATE,
		TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE,
		TiC.PROPERTY_EDITING,
		TiC.PROPERTY_FAST_SCROLL,
		TiC.PROPERTY_FOOTER_TITLE,
		TiC.PROPERTY_FOOTER_VIEW,
		TiC.PROPERTY_HEADER_TITLE,
		TiC.PROPERTY_HEADER_VIEW,
		TiC.PROPERTY_REFRESH_CONTROL,
		TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE,
		TiC.PROPERTY_SEARCH_TEXT,
		TiC.PROPERTY_SEARCH_VIEW,
		TiC.PROPERTY_SEPARATOR_COLOR,
		TiC.PROPERTY_SEPARATOR_HEIGHT,
		TiC.PROPERTY_SEPARATOR_STYLE,
		TiC.PROPERTY_SHOW_SELECTION_CHECK,
		TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR,
		TiC.PROPERTY_TEMPLATES,
		TiC.PROPERTY_TOUCH_FEEDBACK,
		TiC.PROPERTY_TOUCH_FEEDBACK_COLOR
	}
)
public class ListViewProxy extends RecyclerViewProxy
{
	private static final String TAG = "ListViewProxy";

	private List<ListSectionProxy> sections = new ArrayList<>();
	private HashMap<Integer, Set<Integer>> markers = new HashMap<>();
	private KrollDict contentOffset = null;
	private final MoveEventInfo moveEventInfo = new MoveEventInfo();
	private boolean shouldUpdate = true;

	public ListViewProxy()
	{
		super();

		defaultValues.put(TiC.PROPERTY_CAN_SCROLL, true);
		defaultValues.put(TiC.PROPERTY_CASE_INSENSITIVE_SEARCH, true);
		defaultValues.put(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE, UIModule.LIST_ITEM_TEMPLATE_DEFAULT);
		defaultValues.put(TiC.PROPERTY_FAST_SCROLL, false);
		defaultValues.put(TiC.PROPERTY_SHOW_SELECTION_CHECK, true);
		defaultValues.put(TiC.PROPERTY_TOUCH_FEEDBACK, true);
	}

	/**
	 * Add marker for list item.
	 * This will fire the `marker` event when the item is scrolled into view.
	 *
	 * @param markerProperties Dictionary defining marker.
	 */
	@Kroll.method
	public void addMarker(KrollDict markerProperties)
	{
		final int sectionIndex = markerProperties.optInt(TiC.PROPERTY_SECTION_INDEX, -1);
		final int itemIndex = markerProperties.optInt(TiC.PROPERTY_ITEM_INDEX, -1);

		if (sectionIndex > -1 && itemIndex > -1) {
			if (markers.containsKey(sectionIndex)) {
				final Set<Integer> itemIndexSet = markers.get(sectionIndex);

				itemIndexSet.add(itemIndex);
			} else {
				final Set<Integer> itemIndexSet = new HashSet<>();

				itemIndexSet.add(itemIndex);
				markers.put(sectionIndex, itemIndexSet);
			}
		}
	}

	/**
	 * Append sections to list.
	 *
	 * @param sections Sections to append.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void appendSection(Object sections, @Kroll.argument(optional = true) KrollDict animation)
	{
		if (sections instanceof Object[]) {

			// Append ListSection array.
			for (final Object o : (Object[]) sections) {
				if (o instanceof ListSectionProxy) {
					final ListSectionProxy section = (ListSectionProxy) o;

					section.setParent(this);
					this.sections.add(section);
				}
			}

			// Notify ListView of new sections.
			update();

		} else if (sections instanceof ListSectionProxy) {
			final ListSectionProxy section = (ListSectionProxy) sections;

			// Append ListSection.
			section.setParent(this);
			this.sections.add(section);

			// Notify ListView of new section.
			update();
		}
	}

	/**
	 * Create TiUIListView for proxy.
	 *
	 * @param activity the context activity.
	 * @return TiUIView
	 */
	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIListView(this);
	}

	/**
	 * Delete a list item from specified adapter position.
	 *
	 * @param adapterIndex Index of item in adapter.
	 */
	public void swipeItem(int adapterIndex)
	{
		final TiListView listView = getListView();

		if (listView != null) {
			final ListItemProxy item = listView.getAdapterItem(adapterIndex);
			final TiViewProxy parentProxy = item.getParent();
			if (parentProxy instanceof ListSectionProxy) {
				final ListSectionProxy section = (ListSectionProxy) parentProxy;
				item.fireSyncEvent(TiC.EVENT_DELETE, null);
				section.deleteItemsAt(item.getIndexInSection(), 1, null);
			}
		}
	}

	/**
	 * Move a list item from one position to another.
	 *
	 * @param fromAdapterIndex Index of item in adapter.
	 * @param toAdapterIndex Index of item in adapter.
	 * @return
	 * Returns adapter index the item was moved to after updating adapter list,
	 * which might not match given "toAdapterIndex" if moved to an empty section placeholder.
	 * <p/>
	 * Returns -1 if item was not moved. Can happen if indexes are invalid or if move to destination is not allowed.
	 */
	public int moveItem(int fromAdapterIndex, int toAdapterIndex)
	{
		final TiListView listView = getListView();

		if (listView != null) {
			final ListItemProxy fromItem = listView.getAdapterItem(fromAdapterIndex);
			final ListSectionProxy fromSection = (ListSectionProxy) fromItem.getParent();
			final int fromIndex = fromItem.getIndexInSection();
			final ListItemProxy toItem = listView.getAdapterItem(toAdapterIndex);
			final TiViewProxy parentProxy = toItem.getParent();

			if (parentProxy instanceof ListSectionProxy) {
				final ListSectionProxy toSection = (ListSectionProxy) parentProxy;
				final int toIndex = Math.max(toItem.getIndexInSection(), 0);

				// Prevent updating items during move operations.
				shouldUpdate = false;

				fromSection.deleteItemsAt(fromIndex, 1, null);
				toSection.insertItemsAt(toIndex, fromItem, null);

				// Allow updating items after move operations.
				shouldUpdate = true;
				update();

				return listView.getAdapterIndex(fromItem);
			}
		}
		return -1;
	}

	/**
	 * Called when item drag-and-drop movement is about to start.
	 *
	 * @param adapterIndex Index of item in adapter that is about to be moved.
	 * @return Returns true if item movement is allowed. Returns false to prevent item movement.
	 */
	public boolean onMoveItemStarting(int adapterIndex)
	{
		final TiListView listView = getListView();
		if ((listView != null) && (adapterIndex >= 0)) {
			final ListItemProxy itemProxy = listView.getAdapterItem(adapterIndex);
			if (itemProxy != null) {
				final TiViewProxy parentProxy = itemProxy.getParent();
				if (parentProxy instanceof ListSectionProxy) {
					this.moveEventInfo.sectionProxy = (ListSectionProxy) parentProxy;
					this.moveEventInfo.sectionIndex = getIndexOfSection(this.moveEventInfo.sectionProxy);
					this.moveEventInfo.itemIndex = itemProxy.getIndexInSection();
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Called when item drag-and-drop movement has ended.
	 *
	 * @param adapterIndex Index of position the item was dragged in adapter list.
	 */
	public void onMoveItemEnded(int adapterIndex)
	{
		// Fire a "move" event.
		final TiListView listView = getListView();
		if ((listView != null) && this.moveEventInfo.isMoving()) {
			final ListItemProxy targetItemProxy = listView.getAdapterItem(adapterIndex);
			if (targetItemProxy != null) {
				final TiViewProxy targetParentProxy = targetItemProxy.getParent();
				if (targetParentProxy instanceof ListSectionProxy) {
					ListSectionProxy targetSectionProxy = (ListSectionProxy) targetParentProxy;
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_SECTION, this.moveEventInfo.sectionProxy);
					data.put(TiC.PROPERTY_SECTION_INDEX, this.moveEventInfo.sectionIndex);
					data.put(TiC.PROPERTY_ITEM_INDEX, this.moveEventInfo.itemIndex);
					data.put(TiC.PROPERTY_TARGET_SECTION, targetSectionProxy);
					data.put(TiC.PROPERTY_TARGET_SECTION_INDEX, getIndexOfSection(targetSectionProxy));
					data.put(TiC.PROPERTY_TARGET_ITEM_INDEX, targetItemProxy.getIndexInSection());
					targetItemProxy.fireEvent(TiC.EVENT_MOVE, data);
				}
			}
		}

		// Clear last "move" event info.
		this.moveEventInfo.clear();
	}

	/**
	 * Called when starting a drag-and-drop gesture (touch start)
	 */
	public void onMoveGestureStarted()
	{
		fireEvent(TiC.EVENT_MOVE_START, null);
	}

	/**
	 * Called when starting a drag-and-drop gesture (touch end)
	 */
	public void onMoveGestureEnded()
	{
		fireEvent(TiC.EVENT_MOVE_END, null);
	}

	/**
	 * Remove section from list at specified index.
	 *
	 * @param index Index of section to remove.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void deleteSectionAt(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		final ListSectionProxy section = getSectionByIndex(index);

		if (section != null) {

			// Remove section from list.
			section.setParent(null);
			this.sections.remove(section);

			// Notify ListView of removed section.
			update();
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ListView";
	}

	/**
	 * Get index for specified section.
	 *
	 * @param section Section of index to obtain.
	 * @return Integer of index.
	 */
	public int getIndexOfSection(ListSectionProxy section)
	{
		return this.sections.indexOf(section);
	}

	/**
	 * Get native ListView implementation.
	 *
	 * @return TiListView
	 */
	public TiListView getListView()
	{
		final TiUIListView view = (TiUIListView) this.view;

		if (view != null) {
			return view.getListView();
		}
		return null;
	}

	/**
	 * Get section for specified index.
	 *
	 * @param index Index of section to obtain.
	 * @return ListSectionProxy.
	 */
	public ListSectionProxy getSectionByIndex(int index)
	{
		final ListSectionProxy section = this.sections.get(index);

		if (section != null) {
			return section;
		}
		return null;
	}

	/**
	 * Get current section count.
	 *
	 * @return Number of sections in list.
	 */
	@Kroll.getProperty
	public int getSectionCount()
	{
		return sections.size();
	}

	/**
	 * Get current sections.
	 *
	 * @return Array of ListSections.
	 */
	@Kroll.getProperty
	public ListSectionProxy[] getSections()
	{
		return this.sections.toArray(new ListSectionProxy[this.sections.size()]);
	}

	/**
	 * Get selected items.
	 *
	 * @return Array of ListItemProxy.
	 */
	@Kroll.getProperty
	public KrollDict[] getSelectedItems()
	{
		final TiListView listView = getListView();

		if (listView != null) {
			final List<KrollDict> selectedItems = listView.getSelectedItems();

			if (selectedItems != null) {
				return selectedItems.toArray(new KrollDict[selectedItems.size()]);
			}
		}

		return new KrollDict[0];
	}

	/**
	 * Is ListView currently filtered by search results.
	 *
	 * @return Boolean
	 */
	public boolean isFiltered()
	{
		final TiListView listView = getListView();

		if (listView != null) {
			return listView.isFiltered();
		}

		return false;
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		super.onPropertyChanged(name, value);

		processProperty(name, value);
	}

	/**
	 * Sets the activity this proxy's view should be attached to.
	 * @param activity The activity this proxy's view should be attached to.
	 */
	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);

		if (hasPropertyAndNotNull(TiC.PROPERTY_SEARCH_VIEW)) {
			final TiViewProxy search = (TiViewProxy) getProperty(TiC.PROPERTY_SEARCH_VIEW);
			search.setActivity(activity);
		}

		if (this.sections != null) {
			for (ListSectionProxy section : this.sections) {
				section.setActivity(activity);
			}
		}
	}

	// NOTE: For internal use only.
	public KrollDict getContentOffset()
	{
		final TiListView listView = getListView();

		if (listView != null) {
			final KrollDict contentOffset = new KrollDict();

			final int x = (int) new TiDimension(listView.getScrollOffsetX(),
				TiDimension.TYPE_WIDTH, COMPLEX_UNIT_DIP).getAsDefault(listView);
			final int y = (int) new TiDimension(listView.getScrollOffsetY(),
				TiDimension.TYPE_HEIGHT, COMPLEX_UNIT_DIP).getAsDefault(listView);

			contentOffset.put(TiC.PROPERTY_X, x);
			contentOffset.put(TiC.PROPERTY_Y, y);

			// NOTE: Since obtaining the scroll offset from RecyclerView is unreliable
			// when items are added/removed, also grab the current visible item instead.
			final ListItemProxy firstVisibleItem = listView.getFirstVisibleItem();
			if (firstVisibleItem != null) {
				final int currentIndex = listView.getAdapterIndex(firstVisibleItem.index);
				contentOffset.put(TiC.PROPERTY_INDEX, currentIndex);
			}

			this.contentOffset = contentOffset;
		}

		return this.contentOffset;
	}

	@Kroll.method
	public void setContentOffset(KrollDict contentOffset, @Kroll.argument(optional = true) KrollDict options)
	{
		final TiListView listView = getListView();

		if (contentOffset != null) {
			this.contentOffset = contentOffset;

			if (listView != null) {

				if (contentOffset.containsKeyAndNotNull(TiC.PROPERTY_INDEX)) {

					// If available, scroll to provided index provided by internal `getContentOffset()` method.
					listView.getRecyclerView().scrollToPosition(contentOffset.getInt(TiC.PROPERTY_INDEX));
					return;
				}

				final int x = contentOffset.optInt(TiC.EVENT_PROPERTY_X, 0);
				final int y = contentOffset.optInt(TiC.EVENT_PROPERTY_Y, 0);
				final int pixelX = new TiDimension(x, TiDimension.TYPE_WIDTH).getAsPixels(listView);
				final int pixelY = new TiDimension(y, TiDimension.TYPE_HEIGHT).getAsPixels(listView);

				// NOTE: `scrollTo()` is not supported, this is a minor workaround.
				listView.getRecyclerView().scrollToPosition(0);
				listView.getRecyclerView().post(new Runnable()
				{
					@Override
					public void run()
					{
						listView.getRecyclerView().scrollBy(pixelX, pixelY);
					}
				});
			}
		}
	}

	/**
	 * Handle setting of property.
	 *
	 * @param name Property name.
	 * @param value Property value.
	 */
	@Override
	public void setProperty(String name, Object value)
	{
		super.setProperty(name, value);

		processProperty(name, value);
	}

	/**
	 * Process property set on proxy.
	 *
	 * @param name Property name.
	 * @param value Property value.
	 */
	private void processProperty(String name, Object value)
	{
		if (name.equals(TiC.PROPERTY_SECTIONS)) {

			// Set list sections.
			setSections((Object[]) value);

		} else if (name.equals(TiC.PROPERTY_EDITING) || name.equals(TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE)
			|| name.equals(TiC.PROPERTY_VISIBLE)) {
			final TiViewProxy parent = getParent();

			if (parent != null) {

				// Due to Android limitations, selection trackers cannot be removed.
				// Re-create ListView with new selection tracker.
				parent.recreateChild(this);
			}

		} else if (name.equals(TiC.PROPERTY_SHOW_SELECTION_CHECK)) {
			// Update and refresh list.
			update(true);
		} else if (name.equals(TiC.PROPERTY_CONTINUOUS_UPDATE)) {
			final TiListView listView = getListView();
			if (listView != null) {
				listView.setContinousUpdate(TiConvert.toBoolean(value, false));
			}
		} else if (name.equals("forceUpdates")) {
			final TiListView listView = getListView();
			if (listView != null) {
				listView.setForceUpdates(TiConvert.toBoolean(value, false));
			}
		}
	}

	/**
	 * Set sections for list.
	 *
	 * @param sections Array of sections to set.
	 */
	@Kroll.setProperty
	public void setSections(Object sections)
	{
		this.sections.clear();

		if (sections instanceof Object[]) {
			for (Object o : (Object[]) sections) {
				if (o instanceof ListSectionProxy) {
					final ListSectionProxy section = (ListSectionProxy) o;

					// Add section.
					section.setParent(this);
					this.sections.add(section);
				}
			}
		}

		update();
	}

	/**
	 * Override `handleGetView()` to update table if it has been re-used.
	 * (removed and re-added to a view)
	 *
	 * @return TiUIView
	 */
	@Override
	protected TiUIView handleGetView()
	{
		final TiUIView view = super.handleGetView();

		// Update table if being re-used.
		if (view != null) {
			update();

			if (this.contentOffset != null) {

				// Restore previous content position.
				setContentOffset(this.contentOffset, null);
			}
		}

		return view;
	}

	/**
	 * Determine if `marker` event should be fired.
	 */
	public void handleMarkers()
	{
		final TiListView listView = getListView();

		if (markers == null || markers.isEmpty() || listView == null) {
			return;
		}

		final ListItemProxy[] items =
			new ListItemProxy[] { listView.getFirstVisibleItem(), listView.getLastVisibleItem()};

		for (final ListItemProxy item : items) {
			if (item != null) {
				final Object parent = item.getParent();

				if (parent instanceof ListSectionProxy) {
					final ListSectionProxy section = (ListSectionProxy) parent;
					final int sectionIndex = getIndexOfSection(section);

					if (markers.containsKey(sectionIndex)) {

						// Found marker for current section.
						final Set<Integer> itemIndexSet = markers.get(sectionIndex);

						// Loop through markers for current section and determine visibility.
						// Some items may not have scrolled into view.
						for (Iterator<Integer> i = itemIndexSet.iterator(); i.hasNext(); ) {
							final Integer index = i.next();

							final ListItemProxy markedItem = section.getListItemAt(index);
							if (markedItem == null) {
								continue;
							}
							final TiUIView markedView = markedItem.peekView();
							if (markedView == null) {
								continue;
							}
							final View markedNativeView = markedView.getNativeView();
							if (markedNativeView == null) {
								continue;
							}
							final boolean isVisible = markedNativeView.isShown();

							if (isVisible) {
								final KrollDict data = new KrollDict();

								// Create and fire marker event.
								data.put(TiC.PROPERTY_SECTION_INDEX, sectionIndex);
								data.put(TiC.PROPERTY_ITEM_INDEX, index);
								fireEvent(TiC.EVENT_MARKER, data, false);

								// One time event, remove marker.
								i.remove();
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Insert sections at specified index.
	 *
	 * @param index Index to insert sections at.
	 * @param sections Sections to insert into list.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertSectionAt(int index, Object sections,
								@Kroll.argument(optional = true) KrollDict animation)
	{
		final int rawIndex = this.sections.indexOf(getSectionByIndex(index));

		if (rawIndex > -1) {
			if (sections instanceof Object[]) {

				// Insert ListSection array.
				for (final Object o : (Object[]) sections) {
					if (o instanceof ListSectionProxy) {
						final ListSectionProxy section = (ListSectionProxy) o;

						// Inset ListSection.
						section.setParent(this);
						this.sections.add(rawIndex, section);
					}
				}

				// Notify ListView of new sections.
				update();

			} else if (sections instanceof ListSectionProxy) {
				final ListSectionProxy section = (ListSectionProxy) sections;

				// Insert ListSection.
				section.setParent(this);
				this.sections.add(rawIndex, section);

				// Notify ListView of new section.
				update();
			}
		}
	}

	/**
	 * Release all views and items.
	 */
	@Override
	public void release()
	{
		releaseViews();

		if (this.sections != null) {
			this.sections.clear();
			this.sections = null;
		}

		if (this.markers != null) {
			this.markers.clear();
			this.markers = null;
		}

		super.release();
	}

	/**
	 * Release all sections.
	 */
	public void releaseSections()
	{
		for (ListSectionProxy section : this.sections) {
			section.releaseViews();
		}
	}

	/**
	 * Release all views associated with ListView.
	 */
	@Override
	public void releaseViews()
	{
		this.contentOffset = getContentOffset();

		super.releaseViews();

		if (hasPropertyAndNotNull(TiC.PROPERTY_SEARCH_VIEW)) {
			final TiViewProxy search = (TiViewProxy) getProperty(TiC.PROPERTY_SEARCH_VIEW);
			search.releaseViews();
		}

		// Release all section views.
		releaseSections();
	}

	/**
	 * Replace section at specified index.
	 *
	 * @param index Index of section to replace.
	 * @param section Sections replace with.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void replaceSectionAt(int index, ListSectionProxy section,
								 @Kroll.argument(optional = true) KrollDict animation)
	{
		final ListSectionProxy previousSection = getSectionByIndex(index);
		final int rawIndex = this.sections.indexOf(previousSection);

		if (rawIndex > -1) {

			// Replace section.
			previousSection.setParent(null);
			section.setParent(this);
			this.sections.remove(rawIndex);
			this.sections.add(rawIndex, section);

			// Notify ListView of section.
			update();
		}
	}

	/**
	 * Scroll to item in list.
	 *
	 * @param sectionIndex Index of section for item.
	 * @param itemIndex Index of item in section.
	 */
	@Kroll.method
	public void scrollToItem(int sectionIndex, int itemIndex, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TiListView listView = getListView();
		final boolean animated = animation == null || animation.optBoolean(TiC.PROPERTY_ANIMATED, true);
		final int position = animation != null ? animation.optInt(TiC.PROPERTY_POSITION, 0) : 0;
		final RecyclerView.SmoothScroller smoothScrollerToTop =
			new LinearSmoothScroller(TiApplication.getAppCurrentActivity())
			{
				@Override
				protected int getVerticalSnapPreference()
				{ return LinearSmoothScroller.SNAP_TO_START; }
			};

		if (listView != null) {
			final ListSectionProxy section = getSectionByIndex(sectionIndex);

			if (section != null) {
				final ListItemProxy item = section.getListItemAt(itemIndex);

				if (item != null) {
					final int itemAdapterIndex = listView.getAdapterIndex(item.index);
					final Runnable action = () -> {
						if (animated) {
							if (position == ListViewScrollPositionModule.TOP) {
								smoothScrollerToTop.setTargetPosition(itemAdapterIndex);
								listView.getRecyclerView().getLayoutManager().startSmoothScroll(smoothScrollerToTop);
							} else {
								listView.getRecyclerView().smoothScrollToPosition(itemAdapterIndex);
							}
						} else {
							if (position == ListViewScrollPositionModule.TOP) {
								((LinearLayoutManager) listView.getRecyclerView().getLayoutManager())
									.scrollToPositionWithOffset(itemAdapterIndex, 0);
							} else {
								listView.getRecyclerView().scrollToPosition(itemAdapterIndex);
							}
						}
					};

					// This is a workaround for when `EDITING` mode is set, as it recreates the ListView.
					// We need to listen for when it has updated before scrolling.
					if (!listView.getHasLaidOutChildren()) {
						listView.addOnLayoutChangeListener(new View.OnLayoutChangeListener()
						{
							@Override
							public void onLayoutChange(View view, int i, int i1, int i2, int i3, int i4, int i5, int i6,
													   int i7)
							{
								action.run();
								listView.removeOnLayoutChangeListener(this);
							}
						});
					} else {
						action.run();
					}
				}
			}
		}
	}

	/**
	 * Select item in list.
	 *
	 * @param sectionIndex Index of section for item.
	 * @param itemIndex Index of item in section.
	 */
	@Kroll.method
	public void selectItem(int sectionIndex, int itemIndex)
	{
		final TiListView listView = getListView();

		if (listView != null) {
			final ListSectionProxy section = getSectionByIndex(sectionIndex);

			if (section != null) {
				final ListItemProxy item = section.getListItemAt(itemIndex);

				if (item != null) {
					final Runnable action = () -> {
						final SelectionTracker tracker = listView.getTracker();
						final TiUIView itemView = item.peekView();
						final boolean visible = itemView != null && itemView.getNativeView().isShown();

						if (!visible) {
							scrollToItem(sectionIndex, itemIndex, null);
						}
						if (tracker != null) {
							tracker.select(item);
						}
					};

					// This is a workaround for when `EDITING` mode is set, as it recreates the ListView.
					// We need to listen for when it has updated before testing visibility/scrolling.
					if (!listView.getHasLaidOutChildren()) {
						listView.addOnLayoutChangeListener(new View.OnLayoutChangeListener()
						{
							@Override
							public void onLayoutChange(View view, int i, int i1, int i2, int i3, int i4, int i5, int i6,
													   int i7)
							{
								action.run();
								listView.removeOnLayoutChangeListener(this);
							}
						});
					} else {
						action.run();
					}
				}
			}
		}
	}

	/**
	 * Set marker for list item.
	 * This will fire the `marker` event when the item is scrolled into view.
	 *
	 * @param markerProperties Dictionary defining marker.
	 */
	@Kroll.method
	public void setMarker(KrollDict markerProperties)
	{
		this.markers.clear();
		addMarker(markerProperties);
	}

	/**
	 * Notify ListView to update all adapter items.
	 */
	public void update(boolean force)
	{
		if (!shouldUpdate) {
			return;
		}
		final TiListView listView = getListView();

		if (listView != null) {
			listView.update(force);
		}
	}
	public void update()
	{
		this.update(false);
	}

	/** Stores starting position info of an item being dragged-and-dropped. */
	private static class MoveEventInfo
	{
		/** Section proxy the item being dragged originally belonged to. */
		public ListSectionProxy sectionProxy;

		/** Index of section in list the item being dragged originally belonged to. */
		public int sectionIndex = -1;

		/** Original index position of the item being dragged. */
		public int itemIndex = -1;

		/**
		 * Determines if this object contains start position info.
		 * @return Returns true if start position info is stored. Returns false if not.
		 */
		public boolean isMoving()
		{
			return (this.itemIndex >= 0);
		}

		/** Clears start position info. Should be called at end of drag-and-drop event. */
		public void clear()
		{
			this.sectionProxy = null;
			this.sectionIndex = -1;
			this.itemIndex = -1;
		}
	}
}
