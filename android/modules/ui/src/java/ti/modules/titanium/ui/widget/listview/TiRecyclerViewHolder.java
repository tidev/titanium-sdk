/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.util.TypedValue;
import android.view.ViewGroup;

import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiFileHelper;

import java.lang.ref.WeakReference;

public abstract class TiRecyclerViewHolder extends RecyclerView.ViewHolder
{
	private static final String TAG = "TiRecyclerViewHolder";

	protected static final int COLOR_GRAY = Color.rgb(169, 169, 169);

	protected static Drawable checkDrawable;
	protected static Drawable disclosureDrawable;
	protected static Drawable dragDrawable;
	protected static Drawable moreDrawable;

	protected static Resources resources;
	protected static TiFileHelper fileHelper;

	protected static int selectableItemBackgroundId = 0;

	protected WeakReference<TiViewProxy> proxy;

	public TiRecyclerViewHolder(final Context context, final ViewGroup viewGroup)
	{
		super(viewGroup);

		if (resources == null) {

			// Obtain resources instance.
			resources = context.getResources();
		}
		if (resources != null) {

			// Attempt to load `titanium_icon_more` drawable.
			if (moreDrawable == null) {
				try {
					final int icon_more_id = R.drawable.titanium_icon_more;
					moreDrawable = resources.getDrawable(icon_more_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_more' not found.");
				}
			}

			// Attempt to load `titanium_icon_checkmark` drawable.
			if (checkDrawable == null) {
				try {
					final int icon_checkmark_id = R.drawable.titanium_icon_checkmark;
					checkDrawable = resources.getDrawable(icon_checkmark_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_checkmark' not found.");
				}
			}

			// Attempt to load `titanium_icon_disclosure` drawable.
			if (disclosureDrawable == null) {
				try {
					final int icon_disclosure_id = R.drawable.titanium_icon_disclosure;
					disclosureDrawable = resources.getDrawable(icon_disclosure_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_disclosure' not found.");
				}
			}

			// Attempt to load `titanium_icon_drag` drawable.
			if (dragDrawable == null) {
				try {
					final int icon_drag_id = R.drawable.titanium_icon_drag;
					dragDrawable = resources.getDrawable(icon_drag_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_drag' not found.");
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
}
