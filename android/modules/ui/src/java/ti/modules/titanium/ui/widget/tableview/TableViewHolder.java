/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBackgroundDrawable;
import org.appcelerator.titanium.view.TiBorderWrapperView;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.PaintDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;
import ti.modules.titanium.ui.widget.TiUITableView;
import ti.modules.titanium.ui.widget.listview.TiRecyclerViewHolder;

public class TableViewHolder extends TiRecyclerViewHolder<TableViewRowProxy>
{
	private static final String TAG = "TableViewHolder";

	private ColorStateList defaultTextColors = null;

	// Caching for view optimization
	private final Map<String, Object> cachedProperties = new HashMap<>();
	private Drawable cachedBackgroundDrawable = null;
	private Drawable cachedRippleDrawable = null;
	private int lastWidth = -1;
	private int lastHeight = -1;

	// Top
	private final TiCompositeLayout header;
	private final TextView headerTitle;

	// Middle
	private final TiBorderWrapperView border;
	private final ViewGroup container;
	private final ImageView leftImage;
	private final TiCompositeLayout content;
	private final TextView title;
	private final ImageView rightImage;

	// Bottom
	private final TiCompositeLayout footer;
	private final TextView footerTitle;

	public TableViewHolder(final Context context, final ViewGroup viewGroup)
	{
		super(context, viewGroup);

		// Obtain views from identifiers.
		this.header = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_header);

		this.headerTitle = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_header_title);

		// Header attributes.
		setTitleAttributes("header", context, this.headerTitle);

		this.border = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content_border);
		this.container = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_outer_content_container);

		this.leftImage = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_left_image);

		this.content = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content);

		this.title = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content_title);
		this.defaultTextColors = this.title.getTextColors();

		this.rightImage = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_right_image);

		this.footer = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_footer);

		this.footerTitle = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_footer_title);

		// Footer attributes.
		setTitleAttributes("footer", context, this.footerTitle);
	}

	/**
	 * Get holders view.
	 * @return View including border.
	 */
	public View getNativeView()
	{
		return this.border;
	}

	/**
	 * Reset row into nominal state.
	 * Note: Does NOT clear cachedProperties so that bind() can skip
	 * re-applying unchanged values via needsUpdate().
	 */
	private void reset()
	{
		this.header.removeAllViews();
		this.content.removeAllViews();
		this.footer.removeAllViews();

		this.header.setVisibility(View.GONE);
		this.headerTitle.setVisibility(View.GONE);
		this.footer.setVisibility(View.GONE);
		this.footerTitle.setVisibility(View.GONE);
		this.leftImage.setVisibility(View.GONE);
		this.title.setVisibility(View.GONE);
		this.rightImage.setVisibility(View.GONE);
		this.rightImage.setOnTouchListener(null);

		this.border.reset();
	}

	/**
	 * Bind proxy to holder.
	 * @param proxy TableViewRowProxy to bind.
	 * @param selected Is row selected.
	 */
	@SuppressLint("ClickableViewAccessibility")
	public void bind(final TableViewRowProxy proxy, final boolean selected)
	{
		reset();

		// Update model proxy holder.
		this.proxy = new WeakReference<>(proxy);

		final TableViewProxy tableViewProxy = proxy.getTableViewProxy();
		if (tableViewProxy == null) {
			return;
		}
		final KrollDict tableViewProperties = tableViewProxy.getProperties();

		// Attempt to obtain parent section proxy is available.
		final TableViewSectionProxy section =
			proxy.getParent() instanceof TableViewSectionProxy ? (TableViewSectionProxy) proxy.getParent() : null;

		// Obtain proxy properties.
		final KrollDict properties = proxy.getProperties();

		// Update row proxy's activity in case it has changed, such as after a dark/light theme change.
		final Context context = this.itemView.getContext();
		if ((context instanceof Activity) && (proxy.getActivity() != context)) {
			proxy.releaseViews();
			proxy.setActivity((Activity) context);
		}
		final Activity activity = proxy.getActivity();

		// Obtain row view.
		final TableViewRowProxy.RowView rowView = (TableViewRowProxy.RowView) proxy.getOrCreateView();
		if (rowView != null) {

			// We use `getContent()` as the native view of a recycled row is changed to our TableViewHolder view.
			// When instead we want the row contents to recycle and display in our new TableViewHolder.
			final ViewGroup nativeRowView = (ViewGroup) rowView.getContent();
			if (nativeRowView == null) {
				return;
			}

			// Set maximum row height.
			final String rawMaxHeight = properties.optString(TiC.PROPERTY_MAX_ROW_HEIGHT,
				tableViewProperties.getString(TiC.PROPERTY_MAX_ROW_HEIGHT));
			final TiDimension maxHeightDimension = TiConvert.toTiDimension(rawMaxHeight, TiDimension.TYPE_HEIGHT);
			final int maxHeight = rawMaxHeight != null ? maxHeightDimension.getAsPixels(itemView) : -1;
			if (maxHeight > -1 && needsUpdate("maxRowHeight", maxHeight)) {
				nativeRowView.measure(0, 0);

				// Enforce max row height.
				if (nativeRowView.getMeasuredHeight() > maxHeight) {
					rowView.getLayoutParams().optionHeight = maxHeightDimension;
				}
			}

			// Set minimum row height.
			final String rawMinHeight = properties.optString(TiC.PROPERTY_MIN_ROW_HEIGHT,
				tableViewProperties.getString(TiC.PROPERTY_MIN_ROW_HEIGHT));
			final int minHeight = TiConvert.toTiDimension(rawMinHeight, TiDimension.TYPE_HEIGHT).getAsPixels(itemView);
			if (needsUpdate("minRowHeight", minHeight)) {
				this.container.setMinimumHeight(minHeight);
			}

			// Set font and text color for title.
			final KrollDict fontDict = properties.getKrollDict(TiC.PROPERTY_FONT);
			if (needsUpdate("font", fontDict)) {
				TiUIHelper.styleText(this.title, fontDict);
			}

			// Set title color.
			int titleColor = 0;
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_COLOR)) {
				final int color = TiConvert.toColor(properties, TiC.PROPERTY_COLOR, proxy.getActivity());

				if (color != Color.TRANSPARENT) {

					// Found `color` property, set as title color.
					titleColor = color;
				}

			} else {

				// Determine title color based on background.
				final int tableBackgroundColor =
					TiConvert.toColor(tableViewProxy.getProperties(), TiC.PROPERTY_BACKGROUND_COLOR, activity);
				final int rowBackgroundColor = TiConvert.toColor(properties, TiC.PROPERTY_BACKGROUND_COLOR, activity);
				final int backgroundColor = rowBackgroundColor != Color.TRANSPARENT
					? rowBackgroundColor : tableBackgroundColor;
				final int defaultTitleColor = backgroundColor < (Color.BLACK / 2) ? Color.WHITE : Color.BLACK;

				if (backgroundColor != Color.TRANSPARENT) {

					// Found background color, set as contrasting title color.
					titleColor = defaultTitleColor;
				}
			}
			if (needsUpdate("titleColor", titleColor)) {
				if (titleColor != Color.TRANSPARENT) {

					// Set specified `title` color.
					this.title.setTextColor(titleColor);
				} else {

					// Set default `title` color from current theme.
					this.title.setTextColor(this.defaultTextColors);
				}
			}

			// Handle row left and right images.
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_LEFT_IMAGE)) {
				final String url = properties.getString(TiC.PROPERTY_LEFT_IMAGE);
				if (needsUpdate("leftImage", url)) {
					final Drawable drawable = TiUIHelper.getResourceDrawable((Object) url);
					if (drawable != null) {
						this.leftImage.setImageDrawable(drawable);
						this.leftImage.setVisibility(View.VISIBLE);
					}
				}
			}

			// Handle selection, override row left image.
			if (tableViewProperties.optBoolean(TiC.PROPERTY_SHOW_SELECTION_CHECK, false)
				&& tableViewProperties.optBoolean(TiC.PROPERTY_EDITING, false)
				&& tableViewProperties.optBoolean(TiC.PROPERTY_ALLOWS_SELECTION_DURING_EDITING, false)
				&& tableViewProperties.optBoolean(TiC.PROPERTY_ALLOWS_MULTIPLE_SELECTION_DURING_EDITING, false)
				&& !proxy.isPlaceholder()) {

				if (selected) {
					this.leftImage.setImageDrawable(checkcircleDrawable);
				} else {
					this.leftImage.setImageDrawable(circleDrawable);
				}
				this.leftImage.setVisibility(View.VISIBLE);
			}

			if (properties.containsKeyAndNotNull(TiC.PROPERTY_RIGHT_IMAGE)) {
				final String url = properties.getString(TiC.PROPERTY_RIGHT_IMAGE);
				if (needsUpdate("rightImage", url)) {
					final Drawable drawable = TiUIHelper.getResourceDrawable((Object) url);
					if (drawable != null) {
						this.rightImage.setImageDrawable(drawable);
						this.rightImage.setVisibility(View.VISIBLE);
					}
				}
			} else {
				final boolean hasCheck = properties.optBoolean(TiC.PROPERTY_HAS_CHECK, false);
				final boolean hasChild = properties.optBoolean(TiC.PROPERTY_HAS_CHILD, false);
				final boolean hasDetail = properties.optBoolean(TiC.PROPERTY_HAS_DETAIL, false);

				// Handle integrated right-side icons.
				if (hasCheck) {
					this.rightImage.setImageDrawable(checkDrawable);
					this.rightImage.setVisibility(View.VISIBLE);
				} else if (hasChild) {
					this.rightImage.setImageDrawable(moreDrawable);
					this.rightImage.setVisibility(View.VISIBLE);
				} else if (hasDetail) {
					this.rightImage.setImageDrawable(disclosureDrawable);
					this.rightImage.setVisibility(View.VISIBLE);
					this.rightImage.setOnTouchListener(new View.OnTouchListener()
					{
						@Override
						public boolean onTouch(View v, MotionEvent e)
						{
							if (e.getAction() == MotionEvent.ACTION_UP) {
								final TiUIView view = proxy.peekView();

								if (view != null) {
									final KrollDict data = view.getLastUpEvent();

									data.put(TiC.EVENT_PROPERTY_DETAIL, true);
									proxy.fireEvent(TiC.EVENT_CLICK, data);
								}
							}
							return true;
						}
					});
				}
			}

			// Display drag drawable when row is movable.
			final boolean isEditing = tableViewProperties.optBoolean(TiC.PROPERTY_EDITING, false);
			final boolean isMoving = tableViewProperties.optBoolean(TiC.PROPERTY_MOVING, false);
			final boolean isMoveable = properties.optBoolean(TiC.PROPERTY_MOVEABLE,
				tableViewProperties.optBoolean(TiC.PROPERTY_MOVEABLE, false));
			final boolean isMovable = properties.optBoolean(TiC.PROPERTY_MOVABLE,
				tableViewProperties.optBoolean(TiC.PROPERTY_MOVABLE, false));
			if ((isEditing || isMoving) && (isMoveable || isMovable)) {
				this.rightImage.setImageDrawable(dragDrawable);
				this.rightImage.setVisibility(View.VISIBLE);
			}

			// Include row content.
			if (proxy != null) {
				final TiUITableView tableView = (TiUITableView) tableViewProxy.getOrCreateView();
				if (tableView == null) {
					return;
				}
				final View nativeTableView = tableView.getOuterView();
				if (nativeTableView == null) {
					return;
				}
				final ViewGroup parentView = (ViewGroup) nativeRowView.getParent();

				if (parentView != null) {
					parentView.removeView(nativeRowView);
				}

				// Obtain background drawable.
				Drawable backgroundDrawable = rowView.getBackground();
				if (backgroundDrawable instanceof TiBackgroundDrawable drawable) {

					backgroundDrawable = drawable.getBackground();
				}

				// Parse background color to determine transparency.
				int backgroundColor = -1;
				if (backgroundDrawable instanceof PaintDrawable drawable) {

					backgroundColor = drawable.getPaint().getColor();
				} else if (backgroundDrawable instanceof ColorDrawable drawable) {

					backgroundColor = drawable.getColor();
				}
				if (Color.alpha(backgroundColor) <= 0) {

					// Do not use drawable for transparent backgrounds.
					backgroundDrawable = null;
				}

				final boolean touchFeedback = tableViewProperties.optBoolean(TiC.PROPERTY_TOUCH_FEEDBACK,
					properties.optBoolean(TiC.PROPERTY_TOUCH_FEEDBACK, true));
				final String touchFeedbackColor =
					tableViewProperties.optString(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR,
						properties.optString(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR, null));

				// Set ripple background, using cache when possible.
				if (touchFeedback) {
					if (getCachedRipple() == null || needsUpdate("rippleKey", touchFeedbackColor)) {
						backgroundDrawable = generateRippleDrawable(backgroundDrawable, touchFeedbackColor);
						setCachedRipple(backgroundDrawable);
					} else {
						backgroundDrawable = getCachedRipple();
					}
				}

				// Set container background, using cache when possible.
				if (needsUpdate("selectedKey", backgroundColor)) {
					this.container.setBackground(generateSelectedDrawable(properties, backgroundDrawable));
				}
				this.container.setActivated(selected);

				// Remove original background as it has been set on `container`.
				nativeRowView.setBackground(null);

				// Allow states to bubble up for ripple effect.
				nativeRowView.setAddStatesFromChildren(true);

				// Amend maximum size for content to parent TableView measured height.
				this.content.setChildFillHeight(nativeTableView.getMeasuredHeight());

				// Add row to content.
				this.content.addView(nativeRowView, rowView.getLayoutParams());
				this.content.setVisibility(View.VISIBLE);
			}
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_TITLE)
				&& proxy.getChildren().length == 0) {

				final String titleText = properties.optString(TiC.PROPERTY_TITLE, "");
				int left = this.title.getPaddingLeft();
				if (properties.containsKeyAndNotNull(TiC.PROPERTY_LEFT)) {
					left = TiConvert.toTiDimension(properties.get(TiC.PROPERTY_LEFT), TiDimension.TYPE_LEFT)
						.getAsPixels(this.itemView);
				}
				int right = this.title.getPaddingRight();
				if (properties.containsKeyAndNotNull(TiC.PROPERTY_RIGHT)) {
					right = TiConvert.toTiDimension(properties.get(TiC.PROPERTY_RIGHT), TiDimension.TYPE_RIGHT)
						.getAsPixels(this.itemView);
				}
				int top = this.title.getPaddingTop();
				if (properties.containsKeyAndNotNull(TiC.PROPERTY_TOP)) {
					top = TiConvert.toTiDimension(properties.get(TiC.PROPERTY_TOP), TiDimension.TYPE_TOP)
						.getAsPixels(this.itemView);
				}
				int bottom = this.title.getPaddingBottom();
				if (properties.containsKeyAndNotNull(TiC.PROPERTY_BOTTOM)) {
					bottom = TiConvert.toTiDimension(properties.get(TiC.PROPERTY_BOTTOM), TiDimension.TYPE_BOTTOM)
						.getAsPixels(this.itemView);
				}
				this.title.setPadding(left, top, right, bottom);

				if (needsUpdate("title", titleText)) {
					// No child views.
					// Only title specified, display row title.
					this.title.setText(titleText);
				}
				this.title.setVisibility(View.VISIBLE);
			}
		}

		// Handle `header` and `footer` for rows.
		setHeaderFooter(tableViewProxy, properties, true, true);

		if (section != null) {

			// Handle `header` and `footer` for  rows with a parent section.
			// Obtain parent section properties.
			final KrollDict sectionProperties = section.getProperties();
			final int indexInSection = proxy.getIndexInSection();
			final int filteredIndex = proxy.getFilteredIndex();

			if (indexInSection == 0 || filteredIndex == 0 || proxy.isPlaceholder()) {

				// Only set header on first row in section.
				setHeaderFooter(tableViewProxy, sectionProperties, true, false);
			}
			if ((indexInSection >= section.getRowCount() - 1)
				|| (filteredIndex >= section.getFilteredRowCount() - 1)
				|| proxy.isPlaceholder()) {

				// Only set footer on last row in section.
				setHeaderFooter(tableViewProxy, sectionProperties, false, true);
			}
		}

		// Update model proxy holder.
		proxy.setHolder(this);
	}

	/**
	 * Set header or footer title attribute values.
	 *
	 * @param prefix Attribute prefix (e.g: 'header' or 'footer')
	 * @param context Application context.
	 * @param title Header or Footer TextView.
	 */
	private void setTitleAttributes(final String prefix, final Context context, final TextView title)
	{
		final Resources.Theme theme = context.getTheme();

		TypedValue sizeValue = new TypedValue();
		TypedValue styleValue = new TypedValue();
		TypedValue colorValue = new TypedValue();
		TypedValue backgroundValue = new TypedValue();
		TypedValue backgroundColorValue = new TypedValue();

		// Obtain header or footer theme attributes.
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr.ti_" + prefix + "TitleSize"),
				sizeValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr.ti_" + prefix + "TitleStyle"),
				styleValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr.ti_" + prefix + "TitleColor"),
				colorValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr.ti_" + prefix + "TitleBackground"),
				backgroundValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr.ti_" + prefix + "TitleBackgroundColor"),
				backgroundColorValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}

		String size = null;
		String style = null;
		if (sizeValue.resourceId != 0) {
			size = resources.getString(sizeValue.resourceId);
		}
		if (styleValue.resourceId != 0) {
			style = resources.getString(styleValue.resourceId);
		}

		// Set title size and style.
		TiUIHelper.styleText(title, null, size, null, style);

		if (colorValue.resourceId != 0) {

			// Set title text color.
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
				title.setTextColor(resources.getColor(colorValue.resourceId, theme));
			} else {
				title.setTextColor(resources.getColor(colorValue.resourceId));
			}

		} else {

			// Set title default text color.
			title.setTextColor(Color.WHITE);
		}

		if (backgroundValue.resourceId != 0) {

			// Set title background drawable.
			title.setBackground(resources.getDrawable(backgroundValue.resourceId, theme));

		} else if (backgroundColorValue.resourceId != 0) {

			// Set title background color.
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
				title.setBackgroundColor(resources.getColor(backgroundColorValue.resourceId, theme));
			} else {
				title.setBackgroundColor(resources.getColor(backgroundColorValue.resourceId));
			}

		} else {

			// Set title default background color.
			title.setBackgroundColor(COLOR_GRAY);
		}
	}

	/**
	 * Set header and footer views/title for row.
	 *
	 * @param tableViewProxy TableView proxy.
	 * @param properties Row proxy holding header/footer.
	 * @param updateHeader Boolean determine if header should be updated.
	 * @param updateFooter Boolean determine if footer should be updated.
	 */
	/**
	 * Set header and footer views/title for row.
	 * Uses TiTableView section header/footer cache to avoid recreating views.
	 *
	 * @param tableViewProxy TableView proxy.
	 * @param properties Row proxy holding header/footer.
	 * @param updateHeader Boolean determine if header should be updated.
	 * @param updateFooter Boolean determine if footer should be updated.
	 */
	private void setHeaderFooter(TiViewProxy tableViewProxy,
								 KrollDict properties,
								 boolean updateHeader,
								 boolean updateFooter)
	{
		if (tableViewProxy == null) {
			return;
		}

		final TiUITableView tiUITableView = (TiUITableView) tableViewProxy.getOrCreateView();
		if (tiUITableView == null) {
			return;
		}

		final View nativeTableView = tiUITableView.getNativeView();
		if (nativeTableView == null) {
			return;
		}

		final TiTableView tiTableView = tiUITableView.getTableView();
		final Context context = this.itemView.getContext();

		// Handle `header` and `footer`.
		if (updateHeader) {

			final String headerTitle = properties.optString(TiC.PROPERTY_HEADER_TITLE,
				properties.getString(TiC.PROPERTY_HEADER));

			if (headerTitle != null) {

				// Handle header title.
				this.headerTitle.setText(headerTitle);
				this.headerTitle.setVisibility(View.VISIBLE);

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {

				// Handle header view with caching.
				final TiViewProxy headerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);
				final String cacheKey = "header_" + System.identityHashCode(headerProxy);
				View headerView = tiTableView != null ? tiTableView.getCachedSectionHeader(cacheKey) : null;

				if (headerView == null) {
					// Create view from proxy if not cached.
					if ((context instanceof Activity) && (headerProxy.getActivity() != context)) {
						headerProxy.releaseViews();
						headerProxy.setActivity((Activity) context);
					}

					final TiUIView view = headerProxy.getOrCreateView();
					if (view != null) {
						headerView = view.getOuterView();
						if (headerView != null && tiTableView != null) {
							tiTableView.cacheSectionHeader(cacheKey, headerView);
						}
					}
				}

				if (headerView != null) {
					final ViewGroup parent = (ViewGroup) headerView.getParent();
					if (parent != null) {
						parent.removeView(headerView);
					}

					// Amend maximum size for header to parent TableView measured height.
					this.header.setChildFillHeight(nativeTableView.getMeasuredHeight());

					this.header.addView(headerView, new ViewGroup.LayoutParams(
						ViewGroup.LayoutParams.MATCH_PARENT,
						ViewGroup.LayoutParams.WRAP_CONTENT));
					this.header.setVisibility(View.VISIBLE);
				}
			}
		}
		if (updateFooter) {
			final String footerTitle = properties.optString(TiC.PROPERTY_FOOTER_TITLE,
				properties.getString(TiC.PROPERTY_FOOTER));

			if (footerTitle != null) {

				// Handle footer title.
				this.footerTitle.setText(footerTitle);
				this.footerTitle.setVisibility(View.VISIBLE);

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {

				// Handle footer view with caching.
				final TiViewProxy footerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);
				final String cacheKey = "footer_" + System.identityHashCode(footerProxy);
				View footerView = tiTableView != null ? tiTableView.getCachedSectionFooter(cacheKey) : null;

				if (footerView == null) {
					// Create view from proxy if not cached.
					if ((context instanceof Activity) && (footerProxy.getActivity() != context)) {
						footerProxy.releaseViews();
						footerProxy.setActivity((Activity) context);
					}

					final TiUIView view = footerProxy.getOrCreateView();
					if (view != null) {
						footerView = view.getOuterView();
						if (footerView != null && tiTableView != null) {
							tiTableView.cacheSectionFooter(cacheKey, footerView);
						}
					}
				}

				if (footerView != null) {
					final ViewGroup parent = (ViewGroup) footerView.getParent();
					if (parent != null) {
						parent.removeView(footerView);
					}

					// Amend maximum size for footer to parent TableView measured height.
					this.footer.setChildFillHeight(nativeTableView.getMeasuredHeight());

					this.footer.addView(footerView, new ViewGroup.LayoutParams(
						ViewGroup.LayoutParams.MATCH_PARENT,
						ViewGroup.LayoutParams.WRAP_CONTENT));
					this.footer.setVisibility(View.VISIBLE);
				}
			}
		}
	}

	/**
	 * Check if property needs update based on caching.
	 * @param key Property key
	 * @param value Property value
	 * @return true if property needs update
	 */
	protected boolean needsUpdate(String key, Object value)
	{
		Object cached = cachedProperties.get(key);
		boolean needsUpdate = !equalsWithNull(cached, value);
		if (needsUpdate) {
			cachedProperties.put(key, value);
		}
		return needsUpdate;
	}

	/**
	 * Safe equals check that handles null values.
	 */
	private boolean equalsWithNull(Object a, Object b)
	{
		if (a == null && b == null) {
			return true;
		}
		if (a == null || b == null) {
			return false;
		}
		return a.equals(b);
	}

	/**
	 * Get cached background drawable.
	 */
	protected Drawable getCachedBackground()
	{
		return cachedBackgroundDrawable;
	}

	/**
	 * Set cached background drawable.
	 */
	protected void setCachedBackground(Drawable drawable)
	{
		this.cachedBackgroundDrawable = drawable;
	}

	/**
	 * Get cached ripple drawable.
	 */
	protected Drawable getCachedRipple()
	{
		return cachedRippleDrawable;
	}

	/**
	 * Set cached ripple drawable.
	 */
	protected void setCachedRipple(Drawable drawable)
	{
		this.cachedRippleDrawable = drawable;
	}

	/**
	 * Check if dimensions changed.
	 */
	protected boolean dimensionsChanged(int width, int height)
	{
		boolean changed = lastWidth != width || lastHeight != height;
		if (changed) {
			lastWidth = width;
			lastHeight = height;
		}
		return changed;
	}
}
