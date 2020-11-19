/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBorderWrapperView;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;

import java.lang.ref.WeakReference;

import ti.modules.titanium.ui.TableViewProxy;
import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;
import ti.modules.titanium.ui.widget.TiUITableView;

public class TableViewHolder extends RecyclerView.ViewHolder
{
	private static String TAG = "TableViewHolder";

	private static final int COLOR_GRAY = Color.rgb(169, 169, 169);

	private static Resources resources;
	private static TiFileHelper fileHelper;

	private static Drawable moreDrawable;
	private static Drawable checkDrawable;
	private static Drawable disclosureDrawable;
	private static int selectableItemBackgroundId = 0;
	private static ColorStateList defaultTextColors = null;

	// Top
	private final ViewGroup header;
	private final TextView headerTitle;

	// Middle
	private final TiBorderWrapperView border;
	private final ViewGroup container;
	private final ImageView leftImage;
	private final TiCompositeLayout content;
	private final TextView title;
	private final ImageView rightImage;

	// Bottom
	private final ViewGroup footer;
	private final TextView footerTitle;

	private WeakReference<TiViewProxy> proxy;

	public TableViewHolder(final Context context, final ViewGroup viewGroup)
	{
		super(viewGroup);

		if (resources == null) {

			// Obtain resources instance.
			resources = context.getResources();
		}
		if (resources != null) {

			// Attempt to load `icon_more` drawable.
			if (moreDrawable == null) {
				try {
					final int icon_more_id = R.drawable.titanium_icon_more;
					moreDrawable = resources.getDrawable(icon_more_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.icon_more' not found.");
				}
			}

			// Attempt to load `icon_checkmark` drawable.
			if (checkDrawable == null) {
				try {
					final int icon_checkmark_id = R.drawable.titanium_icon_checkmark;
					checkDrawable = resources.getDrawable(icon_checkmark_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.icon_checkmark' not found.");
				}
			}

			// Attempt to load `icon_disclosure` drawable.
			if (disclosureDrawable == null) {
				try {
					final int icon_disclosure_id = R.drawable.titanium_icon_disclosure;
					disclosureDrawable = resources.getDrawable(icon_disclosure_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.icon_disclosure' not found.");
				}
			}

			if (selectableItemBackgroundId == 0) {
				try {
					final TypedValue selectableItemBackgroundValue = new TypedValue();
					context.getTheme().resolveAttribute(android.R.attr.selectableItemBackgroundBorderless,
						selectableItemBackgroundValue, true);
					selectableItemBackgroundId = selectableItemBackgroundValue.resourceId;
				} catch (Exception e) {
					Log.w(TAG, "Drawable for default background not found.");
				}
			}
		} else {
			Log.w(TAG, "Could not obtain context resources instance.");
		}
		if (fileHelper == null) {

			// Obtain file helper instance.
			fileHelper = new TiFileHelper(context);
		}

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
		if (defaultTextColors == null) {
			defaultTextColors = this.title.getTextColors();
		}

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

		this.border.reset();
	}

	/**
	 * Get current proxy assigned to holder.
	 * @return TiViewProxy
	 */
	public TiViewProxy getProxy()
	{
		if (this.proxy != null) {
			return this.proxy.get();
		}
		return null;
	}

	/**
	 * Bind proxy to holder.
	 * @param proxy TableViewRowProxy to bind.
	 * @param selected Is row selected.
	 */
	public void bind(final TableViewRowProxy proxy, final boolean selected)
	{
		reset();

		// Update model proxy holder.
		this.proxy = new WeakReference<>(proxy);

		final TableViewProxy tableViewProxy = proxy.getTableViewProxy();
		if (tableViewProxy == null) {
			return;
		}

		// Attempt to obtain parent section proxy is available.
		final TableViewSectionProxy section =
			proxy.getParent() instanceof TableViewSectionProxy ? (TableViewSectionProxy) proxy.getParent() : null;

		// Obtain proxy properties.
		final KrollDict properties = proxy.getProperties();

		// Obtain row view.
		final TableViewRowProxy.RowView rowView = (TableViewRowProxy.RowView) proxy.getOrCreateView();
		if (rowView != null) {

			// We use `getContent()` as the native view of a recycled row is changed to our TableViewHolder view.
			// When instead we want the row contents to recycle and display in our new TableViewHolder.
			final ViewGroup nativeRowView = (ViewGroup) rowView.getContent();
			if (nativeRowView == null) {
				return;
			}

			// Set minimum row height.
			final String rawMinHeight = properties.optString(TiC.PROPERTY_MIN_ROW_HEIGHT, "0");
			final int minHeight = TiConvert.toTiDimension(rawMinHeight, TiDimension.TYPE_HEIGHT).getAsPixels(itemView);
			this.container.setMinimumHeight(minHeight);

			// Set font and text color for title.
			TiUIHelper.styleText(this.title, properties.getKrollDict(TiC.PROPERTY_FONT));

			// Set title color.
			int titleColor = 0;
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_COLOR)) {
				final int color = TiConvert.toColor(properties.getString(TiC.PROPERTY_COLOR));

				if (color != Color.TRANSPARENT) {

					// Found `color` property, set as title color.
					titleColor = color;
				}

			} else {

				// Determine title color based on background.
				final int tableBackgroundColor =
					TiConvert.toColor(tableViewProxy.getProperties(), TiC.PROPERTY_BACKGROUND_COLOR);
				final int rowBackgroundColor = TiConvert.toColor(properties, TiC.PROPERTY_BACKGROUND_COLOR);
				final int backgroundColor = rowBackgroundColor != Color.TRANSPARENT
					? rowBackgroundColor : tableBackgroundColor;
				final int defaultTitleColor = backgroundColor < (Color.BLACK / 2) ? Color.WHITE : Color.BLACK;

				if (backgroundColor != Color.TRANSPARENT) {

					// Found background color, set as contrasting title color.
					titleColor = defaultTitleColor;
				}
			}
			if (titleColor != Color.TRANSPARENT) {

				// Set specified `title` color.
				this.title.setTextColor(titleColor);
			} else {

				// Set default `title` color from current theme.
				this.title.setTextColor(defaultTextColors);
			}

			// Handle row left and right images.
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_LEFT_IMAGE)) {
				final String url = properties.getString(TiC.PROPERTY_LEFT_IMAGE);
				final Drawable drawable = fileHelper.loadDrawable(url, false);
				this.leftImage.setImageDrawable(drawable);
				this.leftImage.setVisibility(View.VISIBLE);
			}
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_RIGHT_IMAGE)) {
				final String url = properties.getString(TiC.PROPERTY_RIGHT_IMAGE);
				final Drawable drawable = fileHelper.loadDrawable(url, false);
				this.rightImage.setImageDrawable(drawable);
				this.rightImage.setVisibility(View.VISIBLE);
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
				}
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

				Drawable backgroundDrawable = rowView.getBackground();

				if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {

					// To enable the ripple effect, we set the foreground to `selectableItemBackgroundBorderless`.
					// However, this is not supported below Android 7.0 so we set the background instead.
					backgroundDrawable = generateRippleDrawable(backgroundDrawable);
				}

				// Set container background.
				this.container.setBackground(generateSelectedDrawable(properties, backgroundDrawable));
				this.container.setActivated(selected);

				// Remove original background as it has been set on `container`.
				nativeRowView.setBackgroundColor(Color.TRANSPARENT);

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

				// No child views.
				// Only title specified, display row title.
				this.title.setText(properties.optString(TiC.PROPERTY_TITLE, ""));
				this.title.setVisibility(View.VISIBLE);
			}
		}

		// Handle `header` and `footer` for rows.
		setHeaderFooter(properties, true, true);

		if (section != null) {

			// Handle `header` and `footer` for  rows with a parent section.
			// Obtain parent section properties.
			final KrollDict sectionProperties = section.getProperties();
			final int indexInSection = proxy.getIndexInSection();
			final int filteredIndex = proxy.getFilteredIndex();

			if (indexInSection == 0 || filteredIndex == 0 || proxy.isPlaceholder()) {

				// Only set header on first row in section.
				setHeaderFooter(sectionProperties, true, false);
			}
			if ((indexInSection >= section.getRowCount() - 1)
				|| (filteredIndex >= section.getFilteredRowCount() - 1)
				|| proxy.isPlaceholder()) {

				// Only set footer on last row in section.
				setHeaderFooter(sectionProperties, false, true);
			}
		}

		// Update model proxy holder.
		proxy.setHolder(this);
	}

	/**
	 * Generate ripple effect drawable from specified drawable.
	 * TODO: Move into a utility class?
	 *
	 * @param drawable Drawable to apply ripple effect.
	 * @return Drawable
	 */
	protected Drawable generateRippleDrawable(Drawable drawable)
	{
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			if (!(drawable instanceof RippleDrawable)) {
				final int[][] rippleStates = new int[][] { new int[] { android.R.attr.state_pressed } };
				final TypedValue typedValue = new TypedValue();
				final Activity activity = TiApplication.getAppRootOrCurrentActivity();
				final TypedArray colorControlHighlight = activity.obtainStyledAttributes(
					typedValue.data, new int[] { android.R.attr.colorControlHighlight });
				final int colorControlHighlightInt = colorControlHighlight.getColor(0, 0);
				final int[] rippleColors = new int[] { colorControlHighlightInt };
				final ColorStateList colorStateList = new ColorStateList(rippleStates, rippleColors);

				// Create the RippleDrawable.
				drawable = new RippleDrawable(colorStateList, drawable, null);
			}
		}
		return drawable;
	}

	/**
	 * Generate selected background from proxy properties.
	 * TODO: Move into a utility class?
	 *
	 * @param properties Dictionary containing selected background properties.
	 * @return Drawable
	 */
	protected Drawable generateSelectedDrawable(KrollDict properties, Drawable drawable)
	{
		if (properties.containsKeyAndNotNull(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE)) {

			final StateListDrawable stateDrawable = new StateListDrawable();
			final Drawable selectedBackgroundDrawable = TiUIHelper.buildBackgroundDrawable(
				properties.getString(TiC.PROPERTY_SELECTED_BACKGROUND_COLOR),
				properties.getString(TiC.PROPERTY_SELECTED_BACKGROUND_IMAGE),
				TiConvert.toBoolean(properties.get(TiC.PROPERTY_BACKGROUND_REPEAT), false),
				null
			);

			stateDrawable.addState(
				new int[] { android.R.attr.state_activated }, selectedBackgroundDrawable);
			stateDrawable.addState(new int[] {}, drawable);

			return stateDrawable;
		}

		return drawable;
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
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
				title.setBackground(resources.getDrawable(backgroundValue.resourceId, theme));
			} else {
				title.setBackground(resources.getDrawable(backgroundValue.resourceId));
			}

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
	 * @param properties Row proxy holding header/footer.
	 * @param updateHeader Boolean determine if header should be updated.
	 * @param updateFooter Boolean determine if footer should be updated.
	 */
	private void setHeaderFooter(KrollDict properties, boolean updateHeader, boolean updateFooter)
	{
		// Handle `header` and `footer`.
		if (updateHeader) {

			final String headerTitle = properties.optString(TiC.PROPERTY_HEADER_TITLE,
				properties.getString(TiC.PROPERTY_HEADER));

			if (headerTitle != null) {

				// Handle header title.
				this.headerTitle.setText(headerTitle);
				this.headerTitle.setVisibility(View.VISIBLE);

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {

				// Handle header view.
				final TiViewProxy headerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);
				final TiUIView view = headerProxy.getOrCreateView();

				if (view != null) {
					final View headerView = view.getOuterView();

					if (headerView != null) {
						final ViewGroup parent = (ViewGroup) headerView.getParent();

						if (parent != null) {
							parent.removeView(headerView);
						}

						// TODO: Do not override fill behaviour, allow child to control fill.
						view.getLayoutParams().autoFillsWidth = true;

						this.header.addView(headerView, view.getLayoutParams());
						this.header.setVisibility(View.VISIBLE);
					}
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

				// Handle footer view.
				final TiViewProxy footerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);
				final TiUIView view = footerProxy.getOrCreateView();

				if (view != null) {
					final View footerView = view.getOuterView();

					if (footerView != null) {
						final ViewGroup parent = (ViewGroup) footerView.getParent();

						if (parent != null) {
							parent.removeView(footerView);
						}

						// TODO: Do not override fill behaviour, allow child to control fill.
						view.getLayoutParams().autoFillsWidth = true;

						this.footer.addView(footerView, view.getLayoutParams());
						this.footer.setVisibility(View.VISIBLE);
					}
				}
			}
		}
	}
}
