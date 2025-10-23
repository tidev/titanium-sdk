/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBackgroundDrawable;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
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

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.RecyclerView;

import java.lang.ref.WeakReference;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiUIListView;

public class ListViewHolder extends TiRecyclerViewHolder<ListItemProxy>
{
	private static final String TAG = "ListViewHolder";

	// Top
	private TiCompositeLayout header;
	private TextView headerTitle;

	// Middle
	private final ConstraintLayout container;
	private ImageView leftImage;
	private final TiCompositeLayout content;
	private ImageView rightImage;

	// Bottom
	private TiCompositeLayout footer;
	private TextView footerTitle;
	private boolean flatLayout = false;

	public ListViewHolder(final Context context, final ViewGroup viewGroup, boolean flatLayout)
	{
		super(context, viewGroup);
		this.flatLayout = flatLayout;

		// Obtain views from identifiers.
		if (!flatLayout) {
			this.header = viewGroup.findViewById(R.id.titanium_ui_listview_holder_header);
			this.headerTitle = viewGroup.findViewById(R.id.titanium_ui_listview_holder_header_title);
			this.leftImage = viewGroup.findViewById(R.id.titanium_ui_listview_holder_left_image);
			this.rightImage = viewGroup.findViewById(R.id.titanium_ui_listview_holder_right_image);
			this.footer = viewGroup.findViewById(R.id.titanium_ui_listview_holder_footer);
			this.footerTitle = viewGroup.findViewById(R.id.titanium_ui_listview_holder_footer_title);
		}

		this.container = viewGroup.findViewById(R.id.titanium_ui_listview_holder);
		this.content = viewGroup.findViewById(R.id.titanium_ui_listview_holder_content);

	}

	/**
	 * Bind proxy to holder.
	 *
	 * @param proxy    ListItemProxy to bind.
	 * @param selected Is row selected.
	 */
	@SuppressLint("ClickableViewAccessibility")
	public void bind(final ListItemProxy proxy, final boolean selected)
	{
		reset();

		// Update model proxy holder.
		this.proxy = new WeakReference<>(proxy);
		proxy.setHolder(this);

		// Obtain ListView proxy for item.
		final ListViewProxy listViewProxy = proxy.getListViewProxy();
		if (listViewProxy == null) {
			return;
		}
		final KrollDict listViewProperties = listViewProxy.getProperties();

		// Attempt to obtain parent section proxy is available.
		final ListSectionProxy section =
			proxy.getParent() instanceof ListSectionProxy ? (ListSectionProxy) proxy.getParent() : null;

		// Obtain proxy properties.
		final KrollDict properties = proxy.getProperties();

		// Set minimum row height.
		final String rawMinHeight = properties.optString(TiC.PROPERTY_MIN_ROW_HEIGHT, "0");
		final int minHeight = TiConvert.toTiDimension(rawMinHeight, TiDimension.TYPE_HEIGHT).getAsPixels(itemView);
		this.content.setMinimumHeight(minHeight);

		boolean canEdit = listViewProperties.optBoolean(TiC.PROPERTY_EDITING, false)
			|| !listViewProperties.optBoolean(TiC.PROPERTY_REQUIRES_EDITING_TO_MOVE, true);

		if (!flatLayout) {
			// Handle selection checkmark.
			if (listViewProperties.optBoolean(TiC.PROPERTY_SHOW_SELECTION_CHECK, false)
				&& canEdit
				&& listViewProperties.optBoolean(TiC.PROPERTY_ALLOWS_SELECTION_DURING_EDITING, false)
				&& listViewProperties.optBoolean(TiC.PROPERTY_ALLOWS_MULTIPLE_SELECTION_DURING_EDITING, false)
				&& !proxy.isPlaceholder()) {

				if (selected) {
					this.leftImage.setImageDrawable(checkcircleDrawable);
				} else {
					this.leftImage.setImageDrawable(circleDrawable);
				}
				this.leftImage.setVisibility(View.VISIBLE);
			}

			// Handle accessory type icon.
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_ACCESSORY_TYPE)) {
				final int accessorType = properties.optInt(TiC.PROPERTY_ACCESSORY_TYPE,
					UIModule.LIST_ACCESSORY_TYPE_NONE);

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

			// Display drag drawable when item can move.
			final boolean isEditing = listViewProperties.optBoolean(TiC.PROPERTY_EDITING, false);
			final boolean canMove = properties.optBoolean(TiC.PROPERTY_CAN_MOVE,
				listViewProperties.optBoolean(TiC.PROPERTY_CAN_MOVE, false));
			if (isEditing && canMove) {
				this.rightImage.setImageDrawable(dragDrawable);
				this.rightImage.setVisibility(View.VISIBLE);

				RecyclerView.ViewHolder mViewHolder = this;
				this.rightImage.setOnTouchListener(new View.OnTouchListener()
				{
					@Override
					public boolean onTouch(View view, MotionEvent motionEvent)
					{
						if (motionEvent.getActionMasked() == MotionEvent.ACTION_DOWN) {
							TiListView listView = listViewProxy.getListView();
							listView.startDragging(mViewHolder);
						}
						return false;
					}
				});
			} else {
				this.rightImage.setOnTouchListener(null);
			}
		}
		if (proxy != null) {
			// Update list item proxy's activity in case it has changed, such as after a dark/light theme change.
			final Context context = this.itemView.getContext();
			if ((context instanceof Activity) && (proxy.getActivity() != context)) {
				proxy.releaseViews();
				proxy.setActivity((Activity) context);
			}

			// Get or create the view. (Must be called after updating activity above.)
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
					if (backgroundDrawable == null
							&& properties.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_COLOR)) {
						backgroundDrawable = nativeView.getBackground();
					}
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

					if (parentView != null) {
						parentView.removeView(borderView);
					}

					final boolean touchFeedback = listViewProperties.optBoolean(TiC.PROPERTY_TOUCH_FEEDBACK, false);
					final String touchFeedbackColor =
						listViewProperties.optString(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR, null);

					// Set ripple background.
					if (touchFeedback) {
						backgroundDrawable = generateRippleDrawable(backgroundDrawable, touchFeedbackColor);
					}

					// Support selected backgrounds.
					nativeView.setBackground(backgroundDrawable);
					this.container.setBackground(generateSelectedDrawable(properties, null));
					this.container.setActivated(selected);

					// Allow states to bubble up for ripple effect.
					borderView.setAddStatesFromChildren(true);

					// Amend maximum size for content to parent ListView measured height.
					this.container.setMinimumHeight(nativeListView.getMeasuredHeight());

					// Add ListViewItem to content.
					this.content.addView(borderView, view.getLayoutParams());
					this.content.setVisibility(View.VISIBLE);
				}
			}
		}

		if (!flatLayout) {
			if (section == null) {

				// Handle `header` and `footer` for rows without a parent section.
				setHeaderFooter(listViewProxy, properties, true, true);

			} else {

				// Handle `header` and `footer` for  rows with a parent section.
				// Obtain parent section properties.
				final KrollDict sectionProperties = section.getProperties();
				final int indexInSection = proxy.getIndexInSection();
				final int filteredIndex = proxy.getFilteredIndex();

				if (indexInSection == 0 || filteredIndex == 0 || proxy.isPlaceholder()) {

					// Only set header on first row in section.
					setHeaderFooter(listViewProxy, sectionProperties, true, false);
				}
				if ((indexInSection >= section.getItemCount() - 1)
					|| (filteredIndex >= section.getFilteredItemCount() - 1)
					|| proxy.isPlaceholder()) {

					// Only set footer on last row in section.
					setHeaderFooter(listViewProxy, sectionProperties, false, true);
				}
			}
		}
	}

	/**
	 * Reset row into nominal state.
	 */
	private void reset()
	{
		this.content.removeAllViews();
		this.content.setVisibility(View.GONE);

		if (!flatLayout) {
			this.header.removeAllViews();
			this.footer.removeAllViews();
			this.header.setVisibility(View.GONE);
			this.headerTitle.setVisibility(View.GONE);
			this.footer.setVisibility(View.GONE);
			this.footerTitle.setVisibility(View.GONE);
			this.leftImage.setVisibility(View.GONE);
			this.rightImage.setVisibility(View.GONE);
		}
	}

	/**
	 * Set header and footer views of holder.
	 *
	 * @param listViewProxy ListView proxy.
	 * @param properties   Properties containing header and footer entries.
	 * @param updateHeader Boolean to determine if the header should be updated.
	 * @param updateFooter Boolean to determine if the footer should be updated.
	 */
	private void setHeaderFooter(TiViewProxy listViewProxy,
								 KrollDict properties,
								 boolean updateHeader,
								 boolean updateFooter)
	{
		if (listViewProxy == null) {
			return;
		}

		final View nativeListView = listViewProxy.getOrCreateView().getNativeView();
		if (nativeListView == null) {
			return;
		}

		final Context context = this.itemView.getContext();

		// Handle `header` and `footer`.
		if (updateHeader) {
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_TITLE)) {
				String titleText = properties.getString(TiC.PROPERTY_HEADER_TITLE);
				handleHeaderFooterTitle(context, this.headerTitle, titleText, "header");

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_HEADER_VIEW)) {
				// Handle header view.
				final TiViewProxy headerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_HEADER_VIEW);
				handleHeaderFooterView(context, nativeListView, this.header, headerProxy);
			}
		}

		if (updateFooter) {
			if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_TITLE)) {
				String titleText = properties.getString(TiC.PROPERTY_FOOTER_TITLE);
				handleHeaderFooterTitle(context, this.footerTitle, titleText, "footer");

			} else if (properties.containsKeyAndNotNull(TiC.PROPERTY_FOOTER_VIEW)) {
				final TiViewProxy footerProxy = (TiViewProxy) properties.get(TiC.PROPERTY_FOOTER_VIEW);
				handleHeaderFooterView(context, nativeListView, this.footer, footerProxy);
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

	private void handleHeaderFooterTitle(Context context, TextView textView, CharSequence text, String themePrefix)
	{
		// Set attributes.
		setTitleAttributes(themePrefix, context, textView);

		// Handle title.
		textView.setText(text);
		textView.setVisibility(View.VISIBLE);

		// Reset layout params to trigger layout update.
		this.container.setLayoutParams(new ConstraintLayout.LayoutParams(
			ConstraintLayout.LayoutParams.MATCH_PARENT,
			ConstraintLayout.LayoutParams.WRAP_CONTENT
		));
	}

	private void handleHeaderFooterView(
		Context context,
		View nativeListView,
		TiCompositeLayout viewContainer,
		TiViewProxy headerOrFooterViewProxy)
	{
		if ((context instanceof Activity) && (headerOrFooterViewProxy.getActivity() != context)) {
			headerOrFooterViewProxy.releaseViews();
			headerOrFooterViewProxy.setActivity((Activity) context);
		}

		final TiUIView view = headerOrFooterViewProxy.getOrCreateView();
		if (view != null) {
			final View headerOrFooterView = view.getOuterView();
			if (headerOrFooterView != null) {
				final ViewGroup parent = (ViewGroup) headerOrFooterView.getParent();
				if (parent != null) {
					parent.removeView(headerOrFooterView);
				}

				// Amend maximum size for header to parent ListView measured height.
				viewContainer.setChildFillHeight(nativeListView.getMeasuredHeight());
				viewContainer.addView(headerOrFooterView, view.getLayoutParams());
				viewContainer.setVisibility(View.VISIBLE);
			}
		}
	}
}
