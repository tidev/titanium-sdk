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
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBorderWrapperView;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;

import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.TableViewSectionProxy;

public class TableViewHolder extends RecyclerView.ViewHolder
{
	private static String TAG = "TableViewHolder";

	private static final int COLOR_GRAY = Color.rgb(169, 169, 169);

	private static Resources resources;
	private static TiFileHelper fileHelper;

	private static Drawable childIndicatorDrawable;
	private static Drawable checkIndicatorDrawable;
	private static int selectableItemBackgroundId = 0;

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

	public TableViewHolder(final Context context, final ViewGroup viewGroup)
	{
		super(viewGroup);

		if (resources == null) {

			// Obtain resources instance.
			resources = context.getResources();
		}
		if (resources != null) {

			// Attempt to load `icon_more` drawable.
			if (childIndicatorDrawable == null) {
				try {
					final int icon_more_id = R.drawable.icon_more;
					childIndicatorDrawable = resources.getDrawable(icon_more_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.icon_more' not found.");
				}
			}

			// Attempt to load `icon_checkmark` drawable.
			if (checkIndicatorDrawable == null) {
				try {
					final int icon_checkmark_id = R.drawable.icon_checkmark;
					checkIndicatorDrawable = resources.getDrawable(icon_checkmark_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.icon_checkmark' not found.");
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
		this.header = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_header);

		this.headerTitle = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_header_title);

		// Header attributes.
		setTitleAttributes("header", context, this.headerTitle);

		this.border = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content_border);
		this.container = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_outer_content_container);

		this.leftImage = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_left_image);

		this.content = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content);

		this.title = viewGroup.findViewById(R.id.titanium_ui_tableview_holder_content_title);
		this.title.setTextColor(Color.BLACK);

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
	public View getView()
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
		this.container.setVisibility(View.GONE);
		this.title.setVisibility(View.GONE);
		this.rightImage.setVisibility(View.GONE);

		this.border.reset();

		this.container.setBackgroundResource(selectableItemBackgroundId);
	}

	/**
	 * Bind proxy to holder.
	 * @param proxy TableViewRowProxy to bind.
	 * @param selected Is row selected.
	 */
	public void bind(final TableViewRowProxy proxy, final boolean selected)
	{
		reset();

		// Attempt to obtain parent section proxy is available.
		final TableViewSectionProxy section =
			proxy.getParent() instanceof TableViewSectionProxy ? (TableViewSectionProxy) proxy.getParent() : null;

		// Obtain proxy properties.
		final KrollDict properties = proxy.getProperties();

		// Specify if row is selected.
		this.itemView.setActivated(selected);

		// Set minimum row height.
		this.container.setMinimumHeight(properties.optInt(TiC.PROPERTY_MIN_ROW_HEIGHT, 0));

		// Set font and text color for title.
		TiUIHelper.styleText(this.title, properties.getKrollDict(TiC.PROPERTY_FONT));
		this.title.setTextColor(TiConvert.toColor(properties.optString(TiC.PROPERTY_COLOR, "black")));

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
		}

		// Handle row child views.
		if (proxy != null && proxy.getChildren().length > 0) {

			// Set content layout.
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_LAYOUT)) {
				this.content.setLayoutArrangement(properties.getString(TiC.PROPERTY_LAYOUT));
			}

			// Include child views.
			for (TiViewProxy child : proxy.getChildren()) {
				final TiUIView view = child.getOrCreateView();
				if (view != null) {

					// Obtain child view including border.
					final View nativeView = view.getOuterView();
					if (nativeView != null) {

						// Remove view from previous parent.
						final ViewGroup parent = (ViewGroup) nativeView.getParent();
						if (parent != null) {
							parent.removeView(nativeView);
						}

						// Finally, add child view to row content view.
						this.content.addView(view.getOuterView(), view.getLayoutParams());
					}
				}
			}
			this.content.setVisibility(View.VISIBLE);

		} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_TITLE)) {

			// Only title specified, display row title.
			this.title.setText(properties.optString(TiC.PROPERTY_TITLE, ""));
			this.title.setVisibility(View.VISIBLE);
		}

		if (section == null) {

			// Handle `header` and `footer` for rows without a parent section.
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER)) {

				// Handle header title.
				this.headerTitle.setText(properties.getString(TiC.PROPERTY_HEADER));
				this.headerTitle.setVisibility(View.VISIBLE);

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {

				// Handle header view.
				final TiViewProxy headerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);
				final TiUIView view = headerProxy.getOrCreateView();
				if (view != null) {
					this.header.addView(view.getOuterView(), view.getLayoutParams());
					this.header.setVisibility(View.VISIBLE);
				}
			}
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER)) {

				// Handle footer title.
				this.footerTitle.setText(properties.getString(TiC.PROPERTY_FOOTER));
				this.footerTitle.setVisibility(View.VISIBLE);

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {

				// Handle footer view.
				final TiViewProxy footerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);
				final TiUIView view = footerProxy.getOrCreateView();
				if (view != null) {
					this.footer.addView(view.getOuterView(), view.getLayoutParams());
					this.footer.setVisibility(View.VISIBLE);
				}
			}

		} else {

			// Handle `header` and `footer` for  rows with a parent section.
			// Obtain parent section properties.
			final KrollDict sectionProperties = section.getProperties();

			// Only set header on first row in section.
			if (proxy.indexInSection == 0) {

				if (sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)) {

					// Handle header title.
					this.headerTitle.setText(sectionProperties.getString(TiC.PROPERTY_HEADER_TITLE));
					this.headerTitle.setVisibility(View.VISIBLE);

				} else if (sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {

					// Handle header view.
					final TiViewProxy headerProxy = (TiViewProxy) sectionProperties.get(TiC.PROPERTY_HEADER_VIEW);
					final TiUIView view = headerProxy.getOrCreateView();
					if (view != null) {
						this.header.addView(view.getOuterView(), view.getLayoutParams());
						this.header.setVisibility(View.VISIBLE);
					}
				}

			// Only set footer on last row in section.
			} else if (proxy.indexInSection == section.getRowCount() - 1) {

				if (sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)) {

					// Handle footer title.
					this.footerTitle.setText(sectionProperties.getString(TiC.PROPERTY_FOOTER_TITLE));
					this.footerTitle.setVisibility(View.VISIBLE);

				} else if (sectionProperties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {

					// Handle footer view.
					final TiViewProxy footerProxy = (TiViewProxy) sectionProperties.get(TiC.PROPERTY_FOOTER_VIEW);
					final TiUIView view = footerProxy.getOrCreateView();
					if (view != null) {
						this.footer.addView(view.getOuterView(), view.getLayoutParams());
						this.footer.setVisibility(View.VISIBLE);
					}
				}
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
			theme.resolveAttribute(TiRHelper.getResource("attr." + prefix + "TitleSize"),
				sizeValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr." + prefix + "TitleStyle"),
				styleValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr." + prefix + "TitleColor"),
				colorValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr." + prefix + "TitleBackground"),
				backgroundValue, true);
		} catch (TiRHelper.ResourceNotFoundException e) {
		}
		try {
			theme.resolveAttribute(TiRHelper.getResource("attr." + prefix + "TitleBackgroundColor"),
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
