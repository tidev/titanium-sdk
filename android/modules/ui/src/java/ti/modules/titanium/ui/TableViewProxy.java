/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.view.View;

import androidx.recyclerview.selection.SelectionTracker;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.LinearSmoothScroller;
import androidx.recyclerview.widget.RecyclerView;

import ti.modules.titanium.ui.widget.TiUITableView;
import ti.modules.titanium.ui.widget.listview.RecyclerViewProxy;
import ti.modules.titanium.ui.widget.tableview.TiTableView;

import static android.util.TypedValue.COMPLEX_UNIT_DIP;

@Kroll.proxy(
	creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_EDITABLE,
		TiC.PROPERTY_EDITING,
		TiC.PROPERTY_FILTER_ANCHORED,
		TiC.PROPERTY_FILTER_ATTRIBUTE,
		TiC.PROPERTY_FILTER_CASE_INSENSITIVE,
		TiC.PROPERTY_FOOTER_DIVIDERS_ENABLED,
		TiC.PROPERTY_FOOTER_TITLE,
		TiC.PROPERTY_FOOTER_VIEW,
		TiC.PROPERTY_HEADER_DIVIDERS_ENABLED,
		TiC.PROPERTY_HEADER_TITLE,
		TiC.PROPERTY_HEADER_VIEW,
		TiC.PROPERTY_MAX_CLASSNAME,
		TiC.PROPERTY_MIN_ROW_HEIGHT,
		TiC.PROPERTY_MOVABLE,
		TiC.PROPERTY_MOVEABLE,
		TiC.PROPERTY_MOVING,
		TiC.PROPERTY_OVER_SCROLL_MODE,
		TiC.PROPERTY_REFRESH_CONTROL,
		TiC.PROPERTY_SCROLLABLE,
		TiC.PROPERTY_SEARCH,
		TiC.PROPERTY_SEPARATOR_COLOR,
		TiC.PROPERTY_SEPARATOR_STYLE,
		TiC.PROPERTY_SHOW_SELECTION_CHECK,
		TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR,
		TiC.PROPERTY_TOUCH_FEEDBACK,
		TiC.PROPERTY_TOUCH_FEEDBACK_COLOR
	}
)
public class TableViewProxy extends RecyclerViewProxy
{
	private static final String TAG = "TableViewProxy";

	private final List<TableViewSectionProxy> sections = new ArrayList<>();
	private KrollDict contentOffset = null;

	private boolean shouldUpdate = true;

	public TableViewProxy()
	{
		super();

		defaultValues.put(TiC.PROPERTY_OVER_SCROLL_MODE, 0);
		defaultValues.put(TiC.PROPERTY_SCROLLABLE, true);
		defaultValues.put(TiC.PROPERTY_SHOW_SELECTION_CHECK, true);
		defaultValues.put(TiC.PROPERTY_TOUCH_FEEDBACK, true);
	}

	/**
	 * Process TableViewRow input to convert dictionaries into proxy instances.
	 *
	 * @param obj TableViewRow proxy or dictionary.
	 * @return TableViewRowProxy
	 */
	static public TableViewRowProxy processRow(Object obj)
	{
		if (obj instanceof HashMap) {
			final TableViewRowProxy row = new TableViewRowProxy();

			row.handleCreationDict(new KrollDict((HashMap) obj));
			return row;
		} else if (obj instanceof TableViewRowProxy) {
			return (TableViewRowProxy) obj;
		}
		return null;
	}

	/**
	 * Process TableViewSection input to convert dictionaries into proxy instances.
	 *
	 * @param obj TableViewSection proxy or dictionary.
	 * @return TableViewSection
	 */
	static public TableViewSectionProxy processSection(Object obj)
	{
		if (obj instanceof HashMap) {
			final TableViewSectionProxy section = new TableViewSectionProxy();

			section.handleCreationDict(new KrollDict((HashMap) obj));
			return section;
		} else if (obj instanceof TableViewSectionProxy) {
			return (TableViewSectionProxy) obj;
		}
		return null;
	}

	/**
	 * Append row or rows to table.
	 *
	 * @param rows      Row object or array of rows to append.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void appendRow(Object rows, @Kroll.argument(optional = true) KrollDict animation)
	{
		appendRowInternal(rows, animation, false);
	}

	private void appendRowInternal(Object rows, KrollDict animation, boolean internalUpdate)
	{
		final List<TableViewRowProxy> rowList = new ArrayList<>();

		if (rows instanceof Object[]) {

			// Handle array of rows.
			for (Object rowObj : (Object[]) rows) {
				final TableViewRowProxy row = processRow(rowObj);

				if (row != null) {
					rowList.add(row);
				}
			}
		} else {
			final TableViewRowProxy row = processRow(rows);

			// Handle single row.
			if (row != null) {
				rowList.add(row);
			}
		}
		if (rowList.size() == 0) {
			return;
		}

		// Prevent updating rows during iteration.
		shouldUpdate = false;

		// Append rows to last section.
		for (TableViewRowProxy row : rowList) {

			// Create section if one does not exist.
			// Or create new section if `headerTitle` is specified.
			if (this.sections.size() == 0
				|| row.hasPropertyAndNotNull(TiC.PROPERTY_HEADER)
				|| row.hasPropertyAndNotNull(TiC.PROPERTY_HEADER_TITLE)
			) {
				final TableViewSectionProxy section = new TableViewSectionProxy();

				// Set `headerTitle` of section from row.
				section.setProperty(TiC.PROPERTY_HEADER_TITLE,
					row.getProperties().optString(TiC.PROPERTY_HEADER_TITLE,
						row.getProperties().getString(TiC.PROPERTY_HEADER)));

				section.setParent(this);
				this.sections.add(section);
			}

			// Obtain last section.
			final TableViewSectionProxy section = this.sections.get(this.sections.size() - 1);

			// Override footer of section.
			section.setProperty(TiC.PROPERTY_FOOTER_TITLE,
				row.getProperties().optString(TiC.PROPERTY_FOOTER_TITLE,
					row.getProperties().getString(TiC.PROPERTY_FOOTER)));

			// Add row to section.
			section.add(row);
		}

		// Allow updating rows after iteration.
		shouldUpdate = true;

		// don't update when coming from setData loop
		if (!internalUpdate) {
			update();
		}
	}

	/**
	 * Append section or sections to table.
	 *
	 * @param sectionObj Section object or array of sections to append.
	 * @param animation  Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void appendSection(Object sectionObj, @Kroll.argument(optional = true) KrollDict animation)
	{
		if (sectionObj instanceof Object[]) {

			// Append TableViewSection array.
			for (final Object o : (Object[]) sectionObj) {
				final TableViewSectionProxy section = processSection(o);

				if (section != null) {
					section.setParent(this);
					this.sections.add(section);
				}
			}
		} else {
			final TableViewSectionProxy section = processSection(sectionObj);

			if (section != null) {

				// Append TableViewSection.
				section.setParent(this);
				this.sections.add(section);
			}
		}

		// Notify TableView of update.
		update();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUITableView(this);
	}

	/**
	 * Delete a list item from specified adapter position.
	 *
	 * @param adapterIndex Index of item in adapter.
	 */
	public void swipeItem(int adapterIndex)
	{
		final TiTableView tableView = getTableView();

		if (tableView != null) {
			final TableViewRowProxy row = tableView.getAdapterItem(adapterIndex);
			final TableViewSectionProxy section = (TableViewSectionProxy) row.getParent();

			row.fireSyncEvent(TiC.EVENT_DELETE, null);

			section.remove(row);
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
		final TiTableView tableView = getTableView();

		if (tableView != null) {
			final TableViewRowProxy fromItem = tableView.getAdapterItem(fromAdapterIndex);
			final TableViewSectionProxy fromSection = (TableViewSectionProxy) fromItem.getParent();
			final TableViewRowProxy toItem = tableView.getAdapterItem(toAdapterIndex);
			final TiViewProxy parentProxy = toItem.getParent();

			if (parentProxy instanceof TableViewSectionProxy) {
				final TableViewSectionProxy toSection = (TableViewSectionProxy) parentProxy;
				final int toIndex = Math.max(toItem.getIndexInSection(), 0);

				// Prevent updating rows during move operation.
				shouldUpdate = false;

				fromSection.remove(fromItem);
				toSection.add(toIndex, fromItem);

				// Allow updating rows after move operation.
				shouldUpdate = true;

				update();
				return tableView.getAdapterIndex(fromItem);
			}
		}
		return -1;
	}

	/**
	 * Called when row drag-and-drop movement is about to start.
	 *
	 * @param adapterIndex Index of row in adapter that is about to be moved.
	 * @return Returns true if row movement is allowed. Returns false to prevent row movement.
	 */
	public boolean onMoveItemStarting(int adapterIndex)
	{
		final TiTableView tableView = getTableView();
		if ((tableView != null) && (adapterIndex >= 0)) {
			final TableViewRowProxy rowProxy = tableView.getAdapterItem(adapterIndex);
			if ((rowProxy != null) && (rowProxy.getParent() instanceof TableViewSectionProxy)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Called when row drag-and-drop movement has ended.
	 *
	 * @param adapterIndex Index of position the row was dragged in adapter list.
	 */
	public void onMoveItemEnded(int adapterIndex)
	{
		// Fire a "move" event.
		final TiTableView tableView = getTableView();
		if ((tableView != null) && (adapterIndex >= 0)) {
			final TableViewRowProxy rowProxy = tableView.getAdapterItem(adapterIndex);
			if (rowProxy != null) {
				rowProxy.fireEvent(TiC.EVENT_MOVE, null);
			}
		}
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
	 * Delete row from table.
	 *
	 * @param rowObj    Row object or row index to remove.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void deleteRow(Object rowObj, @Kroll.argument(optional = true) KrollDict animation)
	{
		if (rowObj instanceof Integer) {
			final int index = ((Integer) rowObj).intValue();

			deleteRow(getRowByIndex(index), null);
		} else {
			final TableViewRowProxy row = processRow(rowObj);

			if (row == null) {
				return;
			}

			final TiViewProxy parent = row.getParent();

			if (parent != null) {
				if (parent instanceof TableViewSectionProxy) {
					final TableViewSectionProxy section = (TableViewSectionProxy) parent;

					// Row is in section, modify section rows.
					section.remove(row);

					// Notify TableView of update.
					update();
				}
			}
		}
	}

	/**
	 * Delete section from table.
	 *
	 * @param index     Section index to remove.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void deleteSection(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewSectionProxy section = getSectionByIndex(index);

		if (section != null) {
			this.sections.remove(section);
			section.setParent(null);

			update();
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableView";
	}

	// NOTE: For internal use only.
	public KrollDict getContentOffset()
	{
		final TiTableView tableView = getTableView();

		if (tableView != null) {
			final KrollDict contentOffset = new KrollDict();

			final int x = (int) new TiDimension(tableView.getScrollOffsetX(),
				TiDimension.TYPE_WIDTH, COMPLEX_UNIT_DIP).getAsDefault(tableView);
			final int y = (int) new TiDimension(tableView.getScrollOffsetY(),
				TiDimension.TYPE_HEIGHT, COMPLEX_UNIT_DIP).getAsDefault(tableView);

			contentOffset.put(TiC.PROPERTY_X, x);
			contentOffset.put(TiC.PROPERTY_Y, y);

			// NOTE: Since obtaining the scroll offset from RecyclerView is unreliable
			// when items are added/removed, also grab the current visible item instead.
			final TableViewRowProxy firstVisibleItem = tableView.getFirstVisibleItem();
			if (firstVisibleItem != null) {
				final int currentIndex = tableView.getAdapterIndex(firstVisibleItem.index);
				contentOffset.put(TiC.PROPERTY_INDEX, currentIndex);
			}

			this.contentOffset = contentOffset;
		}

		return this.contentOffset;
	}

	@Kroll.method
	public void setContentOffset(KrollDict contentOffset, @Kroll.argument(optional = true) KrollDict options)
	{
		final TiTableView tableView = getTableView();

		if (contentOffset != null) {
			this.contentOffset = contentOffset;

			if (tableView != null) {

				if (contentOffset.containsKeyAndNotNull(TiC.PROPERTY_INDEX)) {

					// If available, scroll to provided index provided by internal `getContentOffset()` method.
					tableView.getRecyclerView().scrollToPosition(contentOffset.getInt(TiC.PROPERTY_INDEX));
					return;
				}

				final int x = contentOffset.optInt(TiC.EVENT_PROPERTY_X, 0);
				final int y = contentOffset.optInt(TiC.EVENT_PROPERTY_Y, 0);
				final int pixelX = new TiDimension(x, TiDimension.TYPE_WIDTH).getAsPixels(tableView);
				final int pixelY = new TiDimension(y, TiDimension.TYPE_HEIGHT).getAsPixels(tableView);

				// NOTE: `scrollTo()` is not supported, this is a minor workaround.
				tableView.getRecyclerView().scrollToPosition(0);
				tableView.getRecyclerView().post(new Runnable()
				{
					@Override
					public void run()
					{
						tableView.getRecyclerView().scrollBy(pixelX, pixelY);
					}
				});
			}
		}
	}

	/**
	 * Get current table data.
	 *
	 * @return Array of TableViewRow or TableViewSection proxies.
	 */
	// clang-format off
	@Kroll.getProperty
	public Object[] getData()
	// clang-format on
	{
		return this.sections.toArray();
	}

	/**
	 * Set table data.
	 *
	 * @param data Array of TableViewRows or TableViewSections
	 */
	@Kroll.method
	@Kroll.setProperty
	public void setData(Object[] data)
	// clang-format on
	{
		for (final TableViewSectionProxy section : this.sections) {
			section.releaseViews();
			section.setParent(null);
		}
		this.sections.clear();

		// Preventing updating rows during iteration.
		shouldUpdate = false;

		for (Object d : data) {
			if (d instanceof TableViewRowProxy) {
				final TableViewRowProxy row = (TableViewRowProxy) d;

				// Handle TableViewRow.
				appendRowInternal(row, null, true);

			} else if (d instanceof Object[]) {
				setData((Object[]) d);
				return;

			} else if (d instanceof HashMap) {
				final TableViewRowProxy row = new TableViewRowProxy();

				// Handle TableViewRow dictionary.
				row.handleCreationDict(new KrollDict((HashMap) d));
				appendRowInternal(row, null, true);

			} else if (d instanceof TableViewSectionProxy) {
				final TableViewSectionProxy section = (TableViewSectionProxy) d;

				// Handle TableViewSection.
				appendSection(section, null);
			}
		}

		// Allow updating rows after iteration.
		shouldUpdate = true;
		update();
	}

	/**
	 * Obtain row from specified table index.
	 *
	 * @param index Index of row in table (not index of row in section).
	 * @return TableViewRowProxy
	 */
	private TableViewRowProxy getRowByIndex(int index)
	{
		for (TableViewSectionProxy section : this.sections) {
			for (TableViewRowProxy row : section.rows) {
				if (row.index == index) {
					return row;
				}
			}
		}
		return null;
	}

	/**
	 * Obtain section from specified table index.
	 *
	 * @param index Index of section in table.
	 * @return TableViewSectionProxy
	 */
	private TableViewSectionProxy getSectionByIndex(int index)
	{
		return this.sections.get(index);
	}

	/**
	 * Obtain section index from section.
	 *
	 * @param section Section in table.
	 * @return Integer of index.
	 */
	private int getIndexOfSection(TableViewSectionProxy section)
	{
		return this.sections.indexOf(section);
	}

	/**
	 * Get current section count.
	 *
	 * @return Integer of section count.
	 */
	@Kroll.getProperty
	public int getSectionCount()
	{
		return getSections().length;
	}

	/**
	 * Get current sections in table.
	 *
	 * @return Array of TableViewSectionProxy
	 */
	@Kroll.getProperty
	public TableViewSectionProxy[] getSections()
	{
		return this.sections.toArray(new TableViewSectionProxy[0]);
	}

	/**
	 * Obtain table view instance.
	 *
	 * @return TiTableView
	 */
	public TiTableView getTableView()
	{
		final TiUITableView view = (TiUITableView) this.view;

		if (view != null) {
			return view.getTableView();
		}
		return null;
	}

	/**
	 * Override view handler.
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
	 * Insert row after specified index.
	 *
	 * @param index     Index to insert row after.
	 * @param rowObj    Row to insert.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertRowAfter(int index, Object rowObj, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewRowProxy existingRow = getRowByIndex(index);

		if (existingRow != null) {
			final TiViewProxy parent = existingRow.getParent();

			if (parent != null) {
				if (parent instanceof TableViewSectionProxy) {
					final TableViewSectionProxy section = (TableViewSectionProxy) parent;
					final TableViewRowProxy row = processRow(rowObj);

					if (row == null) {
						return;
					}

					// Row is in section, modify section rows.
					section.add(existingRow.getIndexInSection() + 1, row);

					// Notify TableView of update.
					update();
				}
			}
		}
	}

	/**
	 * Insert row before specified index.
	 *
	 * @param index     Index to insert row before.
	 * @param rowObj    Row to insert.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertRowBefore(int index, Object rowObj, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewRowProxy existingRow = getRowByIndex(index);

		if (existingRow != null) {
			final TiViewProxy parent = existingRow.getParent();

			if (parent != null) {
				if (parent instanceof TableViewSectionProxy) {
					final TableViewSectionProxy section = (TableViewSectionProxy) parent;
					final TableViewRowProxy row = processRow(rowObj);

					if (row == null) {
						return;
					}

					// Row is in section, modify section rows.
					section.add(existingRow.getIndexInSection(), row);

					// Notify TableView of update.
					update();
				}
			}
		}
	}

	/**
	 * Insert section after specified section index.
	 *
	 * @param index      Index of section to insert after.
	 * @param sectionObj Section to insert.
	 * @param animation  Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertSectionAfter(int index, Object sectionObj,
								   @Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewSectionProxy section = processSection(sectionObj);

		if (index > -1 && index <= this.sections.size()) {
			section.setParent(this);
			this.sections.add(index + 1, section);

			// Notify TableView of update.
			update();
		}
	}

	/**
	 * Insert section before specified section index.
	 *
	 * @param index      Index of section to insert before.
	 * @param sectionObj Section to insert.
	 * @param animation  Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void insertSectionBefore(int index, Object sectionObj,
									@Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewSectionProxy section = processSection(sectionObj);

		if (index > -1 && index <= this.sections.size()) {
			section.setParent(this);
			this.sections.add(index, section);

			// Notify TableView of update.
			update();
		}
	}

	/**
	 * Is TableView currently filtered by search results.
	 *
	 * @return Boolean
	 */
	public boolean isFiltered()
	{
		final TiTableView tableView = getTableView();

		if (tableView != null) {
			return tableView.isFiltered();
		}

		return false;
	}

	/**
	 * Release all views and rows.
	 */
	@Override
	public void release()
	{
		if (hasPropertyAndNotNull(TiC.PROPERTY_SEARCH)) {
			final TiViewProxy search = (TiViewProxy) getProperty(TiC.PROPERTY_SEARCH);
			search.releaseViews();
		}
		if (hasPropertyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
			final TiViewProxy header = (TiViewProxy) getProperty(TiC.PROPERTY_HEADER_VIEW);
			header.releaseViews();
		}
		if (hasPropertyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
			final TiViewProxy footer = (TiViewProxy) getProperty(TiC.PROPERTY_FOOTER_VIEW);
			footer.releaseViews();
		}

		releaseViews();
		this.sections.clear();

		super.release();
	}

	/**
	 * Release all views associated with TableView.
	 */
	@Override
	public void releaseViews()
	{
		this.contentOffset = getContentOffset();

		super.releaseViews();

		for (TableViewSectionProxy section : this.sections) {
			section.releaseViews();
		}
	}

	/**
	 * Scroll to index in table.
	 *
	 * @param index     Index to scroll to.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void scrollToIndex(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TiTableView tableView = getTableView();
		final boolean animated = animation == null || animation.optBoolean(TiC.PROPERTY_ANIMATED, true);
		final int position = animation != null ? animation.optInt(TiC.PROPERTY_POSITION, 0) : 0;
		final RecyclerView.SmoothScroller smoothScrollerToTop =
			new LinearSmoothScroller(TiApplication.getAppCurrentActivity())
			{
				@Override
				protected int getVerticalSnapPreference()
				{ return LinearSmoothScroller.SNAP_TO_START; }
			};

		if (tableView != null) {
			final RecyclerView recyclerView = tableView.getRecyclerView();

			if (recyclerView != null) {
				final TableViewRowProxy row = getRowByIndex(index);

				if (row != null) {
					final int rowAdapterIndex = tableView.getAdapterIndex(index);
					final Runnable action = () -> {
						if (animated) {
							if (position == ListViewScrollPositionModule.TOP) {
								smoothScrollerToTop.setTargetPosition(rowAdapterIndex);
								recyclerView.getLayoutManager().startSmoothScroll(smoothScrollerToTop);
							} else {
								recyclerView.smoothScrollToPosition(rowAdapterIndex);
							}
						} else {
							if (position == ListViewScrollPositionModule.TOP) {
								((LinearLayoutManager) recyclerView.getLayoutManager())
									.scrollToPositionWithOffset(rowAdapterIndex, 0);
							} else {
								recyclerView.scrollToPosition(rowAdapterIndex);
							}
						}
					};

					// This is a workaround for when `EDITING` mode is set, as it recreates the TableView.
					// We need to listen for when it has updated before scrolling.
					if (!tableView.getHasLaidOutChildren()) {
						tableView.addOnLayoutChangeListener(new View.OnLayoutChangeListener()
						{
							@Override
							public void onLayoutChange(View view, int i, int i1, int i2, int i3, int i4, int i5, int i6,
													   int i7)
							{
								action.run();
								tableView.removeOnLayoutChangeListener(this);
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
	 * Scroll to index in table.
	 *
	 * @param index     Index to scroll to.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void scrollToTop(int index, @Kroll.argument(optional = true) KrollDict animation)
	{
		scrollToIndex(index, animation);
	}

	/**
	 * Select row at specified index in table.
	 *
	 * @param index Index of row to select.
	 */
	@Kroll.method
	public void selectRow(int index)
	{
		scrollToIndex(index, null);

		final TableViewRowProxy row = getRowByIndex(index);

		if (row != null) {
			final TiTableView tableView = getTableView();

			if (tableView != null) {
				final Runnable action = () -> {
					final SelectionTracker tracker = tableView.getTracker();
					final TiUIView rowView = row.peekView();
					final boolean visible = rowView != null && rowView.getNativeView().isShown();

					if (!visible) {
						scrollToIndex(index, null);
					}
					if (tracker != null) {
						tracker.select(row);
					}
				};

				// This is a workaround for when `EDITING` mode is set, as it recreates the TableView.
				// We need to listen for when it has updated before testing visibility/scrolling.
				if (!tableView.getHasLaidOutChildren()) {
					tableView.addOnLayoutChangeListener(new View.OnLayoutChangeListener()
					{
						@Override
						public void onLayoutChange(View view, int i, int i1, int i2, int i3, int i4, int i5, int i6,
												   int i7)
						{
							action.run();
							tableView.removeOnLayoutChangeListener(this);
						}
					});
				} else {
					action.run();
				}
			}
		}
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

		if (hasPropertyAndNotNull(TiC.PROPERTY_SEARCH)) {
			final TiViewProxy search = (TiViewProxy) getProperty(TiC.PROPERTY_SEARCH);
			search.setActivity(activity);
		}

		for (TableViewSectionProxy section : this.sections) {
			section.setActivity(activity);
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
		if (name.equals(TiC.PROPERTY_DATA) || name.equals(TiC.PROPERTY_SECTIONS)) {
			setData((Object[]) value);

		} else if (name.equals(TiC.PROPERTY_EDITING) || name.equals(TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE)) {
			final TiViewProxy parent = getParent();

			if (parent != null) {

				// Due to Android limitations, selection trackers cannot be removed.
				// Re-create TableView with new selection tracker.
				parent.recreateChild(this);
			}

		} else if (name.equals(TiC.PROPERTY_MOVING)
			|| name.equals(TiC.PROPERTY_SHOW_SELECTION_CHECK)) {

			// Update and refresh table.
			update(true);
		}
	}

	/**
	 * Notify TableView to update all adapter rows.
	 */
	public void update(boolean force)
	{
		if (!shouldUpdate) {
			return;
		}
		final TiTableView tableView = getTableView();

		if (tableView != null) {
			tableView.update(force);
		}
	}
	public void update()
	{
		this.update(false);
	}

	/**
	 * Update row at specified table index.
	 *
	 * @param index     Index of table row to update.
	 * @param rowObj    New row to replace existing row with.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void updateRow(int index, Object rowObj, @Kroll.argument(optional = true) KrollDict animation)
	{
		final TableViewRowProxy existingRow = getRowByIndex(index);

		if (existingRow != null) {
			final TiViewProxy parent = existingRow.getParent();

			if (parent != null) {
				if (parent instanceof TableViewSectionProxy) {
					final TableViewSectionProxy section = (TableViewSectionProxy) parent;
					final TableViewRowProxy row = processRow(rowObj);

					if (row == null) {
						return;
					}

					// Row is in section, modify section row.
					section.set(existingRow.getIndexInSection(), row);

					// Notify TableView of new items.
					update();
				}
			}
		}
	}

	/**
	 * Update section at specified table index.
	 *
	 * @param index     Index of section to update.
	 * @param section   New section to replace existing section with.
	 * @param animation Ignored, for iOS parameter compatibility.
	 */
	@Kroll.method
	public void updateSection(int index, TableViewSectionProxy section,
							  @Kroll.argument(optional = true) KrollDict animation)
	{
		if (index > -1 && index <= this.sections.size()) {
			section.setParent(this);
			this.sections.set(index, section);

			// Notify TableView of update.
			update();
		}
	}
}
