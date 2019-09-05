/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import android.content.Context;
import android.content.res.Configuration;
import android.content.res.TypedArray;
import android.support.v7.widget.Toolbar;
import java.lang.reflect.Field;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiRHelper;

/**
 * Updates a toolbar's height and font size when the orientation changes.
 * Intended to be used by activities which override "configChanges" for orientation since the system won't
 * automatically update toolbars in that case (56dp for portrait and 48dp for landscape).
 * <p>
 * The owner of this handler is expected to call its onConfigurationChanged() method when its activity
 * equivalent method has been invoked.
 */
public class TiToolbarStyleHandler
{
	/** The default Android log tag name to be used by this class. */
	private static final String TAG = "TiToolbarStyleHandler";

	/** The toolbar to be updated with the newest style/size. */
	private Toolbar toolbar;

	/** Custom TextAppearance resource ID to be used by toolbar's title. Set zero to use default style. */
	private int titleTextAppearanceId;

	/** Custom TextAppearance resource ID to be used by toolbar's subtitle. Set zero to use default style. */
	private int subtitleTextAppearanceId;

	/**
	 * Creates a new handler for the given toolbar.
	 * @param toolbar The toolbar to be resized by this handler. Cannot be null.
	 */
	public TiToolbarStyleHandler(Toolbar toolbar)
	{
		if (toolbar == null) {
			throw new NullPointerException();
		}

		this.toolbar = toolbar;
	}

	/**
	 * Gets the toolbar that is being handled by this instance.
	 * @return Returns the toolbar being handled.
	 */
	public Toolbar getToolbar()
	{
		return this.toolbar;
	}

	/**
	 * Gets the custom TextAppearance resource ID assigned to the setTitleTextAppearanceId() method.
	 * @return Returns the assigned resource ID. Returns 0 if using the default toolbar TextAppearance style.
	 */
	public int getTitleTextAppearanceId(int resourceId)
	{
		return this.titleTextAppearanceId;
	}

	/**
	 * Sets the custom TextAppearance resource ID that the toolbar title should use when handler updates its style.
	 * This defines the font color, size, and bold/italic/underline style it will use.
	 * @param resourceId
	 * Integer ID to the TextAppearance style resource providing the custom style.
	 * <p>
	 * Set to zero to use the toolbar's default TextAppearance style.
	 */
	public void setTitleTextAppearanceId(int resourceId)
	{
		this.titleTextAppearanceId = resourceId;
	}

	/**
	 * Gets the custom TextAppearance resource ID assigned to the setSubtitleTextAppearanceId() method.
	 * @return Returns the assigned resource ID. Returns 0 if using the default toolbar TextAppearance style.
	 */
	public int getSubtitleTextAppearanceId(int resourceId)
	{
		return this.subtitleTextAppearanceId;
	}

	/**
	 * Sets the custom TextAppearance resource ID that the toolbar subtitle should use when handler updates its style.
	 * This defines the font color, size, and bold/italic/underline style it will use.
	 * @param resourceId
	 * Integer ID to the TextAppearance style resource providing the custom style.
	 * <p>
	 * Set to zero to use the toolbar's default TextAppearance style.
	 */
	public void setSubtitleTextAppearanceId(int resourceId)
	{
		this.subtitleTextAppearanceId = resourceId;
	}

	/**
	 * To be called by the owner when the activity/view's overridden onConfigurationChanged() method has been called.
	 * Updates the toolbar's height and font size base on the given configuration.
	 * @param newConfig The updated configuration applied to the activity/view.
	 */
	public void onConfigurationChanged(Configuration newConfig)
	{
		try {
			Context context = this.toolbar.getContext();
			TypedArray typedArray = null;

			// Fetch the toolbar's theme resource ID.
			int styleAttributeId = TiRHelper.getResource("attr.toolbarStyle");
			typedArray = context.obtainStyledAttributes(new int[] { styleAttributeId });
			int styleResourceId = typedArray.getResourceId(0, 0);
			typedArray.recycle();

			// Update the title font size and other styles.
			int titleResourceId = this.titleTextAppearanceId;
			if (titleResourceId == 0) {
				int titleAttributeId = TiRHelper.getResource("attr.titleTextAppearance");
				typedArray = context.obtainStyledAttributes(styleResourceId, new int[] { titleAttributeId });
				titleResourceId = typedArray.getResourceId(0, 0);
				typedArray.recycle();
			}
			if (titleResourceId != 0) {
				this.toolbar.setTitleTextAppearance(context, titleResourceId);
			}

			// Update the subtitle font size and other styles.
			int subtitleResourceId = this.subtitleTextAppearanceId;
			if (subtitleResourceId == 0) {
				int subtitleAttributeId = TiRHelper.getResource("attr.subtitleTextAppearance");
				typedArray = context.obtainStyledAttributes(styleResourceId, new int[] { subtitleAttributeId });
				subtitleResourceId = typedArray.getResourceId(0, 0);
				typedArray.recycle();
			}
			if (subtitleResourceId != 0) {
				this.toolbar.setSubtitleTextAppearance(context, subtitleResourceId);
			}

			// Update the toolbar height.
			int barSizeAttributeId = TiRHelper.getResource("attr.actionBarSize");
			typedArray = context.obtainStyledAttributes(new int[] { barSizeAttributeId });
			int barSize = typedArray.getDimensionPixelSize(0, 0);
			if (barSize > 0) {
				this.toolbar.setMinimumHeight(barSize);
			}
			typedArray.recycle();

			// Update the toolbar's undocumented max button height.
			// Note: Ideally, we should not modify a private member variable like this.
			//       Unfortunately, we have to since Google's default ActionBar can internally use a Toolbar.
			// TODO: In the future we should replace Activity's ActionBar with Toolbar and use a custom
			//       theme which replaces "maxButtonHeight" value with -1 to avoid this issue.
			Field field = Toolbar.class.getDeclaredField("mMaxButtonHeight");
			field.setAccessible(true);
			field.set(this.toolbar, barSize);

			// Redraw the toolbar with the above changes.
			this.toolbar.requestLayout();

		} catch (Exception ex) {
			Log.e(TAG, "Failed to resize Toolbar.", ex);
		}
	}
}
