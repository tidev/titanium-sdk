/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

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

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiUIListView;

public class ListViewHolder extends RecyclerView.ViewHolder
{
	private static final String TAG = "ListViewHolder";
	private static final int COLOR_GRAY = Color.rgb(169, 169, 169);

	private static Drawable checkDrawable;
	private static Drawable disclosureDrawable;
	private static TiFileHelper fileHelper;
	private static Drawable moreDrawable;
	private static Resources resources;
	private static int selectableItemBackgroundId = 0;

	// Middle
	private final ViewGroup container;
	private final TiCompositeLayout content;
	// Bottom
	private final ViewGroup footer;
	private final TextView footerTitle;
	// Top
	private final ViewGroup header;
	private final TextView headerTitle;
	private final ImageView rightImage;

	private WeakReference<TiViewProxy> proxy;

	public ListViewHolder(final Context context, final ViewGroup viewGroup)
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
					context.getTheme().resolveAttribute(android.R.attr.selectableItemBackground,
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
		this.header = viewGroup.findViewById(R.id.titanium_ui_listview_holder_header);

		this.headerTitle = viewGroup.findViewById(R.id.titanium_ui_listview_holder_header_title);

		// Header attributes.
		setTitleAttributes("header", context, this.headerTitle);

		this.container = viewGroup.findViewById(R.id.titanium_ui_listview_holder_outer_content_container);

		this.content = viewGroup.findViewById(R.id.titanium_ui_listview_holder_content);

		this.rightImage = viewGroup.findViewById(R.id.titanium_ui_listview_holder_right_image);

		this.footer = viewGroup.findViewById(R.id.titanium_ui_listview_holder_footer);

		this.footerTitle = viewGroup.findViewById(R.id.titanium_ui_listview_holder_footer_title);

		// Footer attributes.
		setTitleAttributes("footer", context, this.footerTitle);
	}

	/**
	 * Bind proxy to holder.
	 *
	 * @param proxy    ListItemProxy to bind.
	 * @param selected Is row selected.
	 */
	public void bind(final ListItemProxy proxy, final boolean selected)
	{
		reset();

		// Update model proxy holder.
		this.proxy = new WeakReference<>(proxy);

		// Obtain ListView proxy for item.
		final ListViewProxy listViewProxy = proxy.getListViewProxy();
		if (listViewProxy == null) {
			return;
		}

		// Attempt to obtain parent section proxy is available.
		final ListSectionProxy section =
			proxy.getParent() instanceof ListSectionProxy ? (ListSectionProxy) proxy.getParent() : null;

		// Obtain proxy properties.
		final KrollDict properties = proxy.getProperties();

		// Set minimum row height.
		final String rawMinHeight = properties.optString(TiC.PROPERTY_MIN_ROW_HEIGHT, "0");
		final int minHeight = TiConvert.toTiDimension(rawMinHeight, TiDimension.TYPE_HEIGHT).getAsPixels(itemView);
		this.content.setMinimumHeight(minHeight);

		// Handle accessory type icon.
		if (properties.containsKeyAndNotNull(TiC.PROPERTY_ACCESSORY_TYPE)) {
			final int accessorType = properties.optInt(TiC.PROPERTY_ACCESSORY_TYPE, UIModule.LIST_ACCESSORY_TYPE_NONE);

			switch (accessorType) {
				case UIModule.LIST_ACCESSORY_TYPE_CHECKMARK:
					this.rightImage.setImageDrawable(checkDrawable);
					break;
				case UIModule.LIST_ACCESSORY_TYPE_DETAIL:
					this.rightImage.setImageDrawable(moreDrawable);
					break;
				case UIModule.LIST_ACCESSORY_TYPE_DISCLOSURE:
					this.rightImage.setImageDrawable(disclosureDrawable);
			}
			if (accessorType != UIModule.LIST_ACCESSORY_TYPE_NONE) {
				this.rightImage.setVisibility(View.VISIBLE);
			}
		}

		if (proxy != null) {
			final TiUIView view = proxy.getOrCreateView();

			if (view != null) {
				final ViewGroup borderView = (ViewGroup) view.getOuterView();
				final ViewGroup nativeView = (ViewGroup) view.getNativeView();

				if (nativeView != null) {
					final TiUIListView listView = (TiUIListView) listViewProxy.getOrCreateView();
					final View nativeListView = listView.getOuterView();
					final ViewGroup parentView = (ViewGroup) borderView.getParent();

					// Obtain background drawable.
					Drawable backgroundDrawable = view.getBackground();
					if (backgroundDrawable == null) {
						backgroundDrawable = nativeView.getBackground();
					}

					if (parentView != null) {
						parentView.removeView(borderView);
					}

					// Set ripple background.
					if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {

						// To enable the ripple effect, we set the foreground to `selectableItemBackgroundBorderless`.
						// However, this is not supported below Android 7.0 so we set the background instead.
						nativeView.setBackground(generateRippleDrawable(backgroundDrawable));
					}

					// Support selected backgrounds.
					nativeView.setBackground(generateSelectedDrawable(properties, backgroundDrawable));
					borderView.setActivated(selected);

					// Allow states to bubble up for ripple effect.
					borderView.setAddStatesFromChildren(true);

					// Amend maximum size for content to parent ListView measured height.
					this.content.setChildFillHeight(nativeListView.getMeasuredHeight());

					// Add ListViewItem to content.
					this.content.addView(borderView, view.getLayoutParams());
					this.content.setVisibility(View.VISIBLE);
				}
			}
		}

		if (section == null) {

			// Handle `header` and `footer` for rows without a parent section.
			setHeaderFooter(properties, true, true);

		} else {

			// Handle `header` and `footer` for  rows with a parent section.
			// Obtain parent section properties.
			final KrollDict sectionProperties = section.getProperties();
			final int indexInSection = proxy.getIndexInSection();
			final int filteredIndex = proxy.getFilteredIndex();

			if (indexInSection == 0 || filteredIndex == 0 || proxy.isPlaceholder()) {

				// Only set header on first row in section.
				setHeaderFooter(sectionProperties, true, false);
			}
			if ((indexInSection >= section.getItems().length - 1)
				|| (filteredIndex >= section.getFilteredItemCount() - 1)
				|| proxy.isPlaceholder()) {

				// Only set footer on last row in section.
				setHeaderFooter(sectionProperties, false, true);
			}
		}

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
	 * Get current proxy assigned to holder.
	 *
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
		this.content.setVisibility(View.GONE);
		this.rightImage.setVisibility(View.GONE);
	}

	/**
	 * Set header and footer views of holder.
	 *
	 * @param properties   Properties containing header and footer entires.
	 * @param updateHeader Boolean to determine if the header should be updated.
	 * @param updateFooter Boolean to determine if the footer should be updated.
	 */
	private void setHeaderFooter(KrollDict properties, boolean updateHeader, boolean updateFooter)
	{
		// Handle `header` and `footer`.
		if (updateHeader) {
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)) {

				// Handle header title.
				this.headerTitle.setText(properties.getString(TiC.PROPERTY_HEADER_TITLE));
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
						this.header.addView(headerView, view.getLayoutParams());
						this.header.setVisibility(View.VISIBLE);
					}
				}
			}
		}
		if (updateFooter) {
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)) {

				// Handle footer title.
				this.footerTitle.setText(properties.getString(TiC.PROPERTY_FOOTER_TITLE));
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
						this.footer.addView(footerView, view.getLayoutParams());
						this.footer.setVisibility(View.VISIBLE);
					}
				}
			}
		}
	}

	/**
	 * Set header or footer title attribute values.
	 *
	 * @param prefix  Attribute prefix (e.g: 'header' or 'footer')
	 * @param context Application context.
	 * @param title   Header or Footer TextView.
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
}
