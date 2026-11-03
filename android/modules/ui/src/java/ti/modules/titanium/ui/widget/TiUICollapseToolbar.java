/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.graphics.Bitmap;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.ImageView;

import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.CollapsingToolbarLayout;
import com.google.android.material.appbar.MaterialToolbar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

public class TiUICollapseToolbar extends TiUIView
{
	private static final String TAG = "TiUICollapseToolbar";
	TiCompositeLayout content = null;
	AppBarLayout appBarLayout;
	CollapsingToolbarLayout collapseToolbarLayout;
	int contentScrimColor = -1;
	int barColor = -1;
	int textColor = -1;
	int navigationColor = -1;
	int scrollFlags = -1;
	int imageHeight = -1;
	ImageView imageView = null;
	MaterialToolbar toolbar = null;
	KrollFunction homeIconFunction = null;
	boolean homeAsUp = false;
	TiViewProxy localContentView = null;

	public TiUICollapseToolbar(TiViewProxy proxy)
	{
		super(proxy);
		this.proxy = proxy;

		try {
			int id_collapse_toolbar = TiRHelper.getResource("layout.titanium_ui_collapse_toolbar");
			int id_imageView = TiRHelper.getResource("id.collapseImageView");
			int id_content = TiRHelper.getResource("id.collapseContent");
			int id_appbar = TiRHelper.getResource("id.appBarLayout");
			int id_toolbarLayout = TiRHelper.getResource("id.collapseToolbarLayout");
			int id_toolbar = TiRHelper.getResource("id.toolbar");
			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppCurrentActivity());
			CoordinatorLayout layout = (CoordinatorLayout) inflater.inflate(id_collapse_toolbar, null);
			imageView = layout.findViewById(id_imageView);
			appBarLayout = layout.findViewById(id_appbar);
			toolbar = appBarLayout.findViewById(id_toolbar);
			collapseToolbarLayout = appBarLayout.findViewById(id_toolbarLayout);
			content = layout.findViewById(id_content);

			if (barColor != -1) {
				setBarColor(barColor);
			}
			if (contentScrimColor != -1) {
				setContentScrimColor(contentScrimColor);
			}
			if (scrollFlags != -1) {
				setFlags(scrollFlags);
			}
			if (imageHeight != -1) {
				setImageHeight(imageHeight);
			}
			if (homeAsUp) {
				setDisplayHomeAsUp(homeAsUp);
			}
			if (textColor != -1) {
				setColor(textColor);
			}
			if (localContentView != null) {
				setContentView(localContentView);
			}

			setNativeView(layout);
		} catch (Exception e) {
			Log.e(TAG, "Layout error: " + e.getMessage());
		}
	}

	public void setContentView(TiViewProxy viewProxy)
	{
		localContentView = viewProxy;
		if (viewProxy == null || content == null) {
			return;
		}
		viewProxy.setActivity(proxy.getActivity());
		TiUIView contentView = viewProxy.getOrCreateView();
		View view = contentView.getOuterView();
		ViewParent viewParent = view.getParent();
		if (viewParent != null && viewParent != content && viewParent instanceof ViewGroup) {
			((ViewGroup) viewParent).removeView(view);

			contentView.getLayoutParams().autoFillsHeight = true;
			contentView.getLayoutParams().autoFillsWidth = true;
		}
		content.addView(view, contentView.getLayoutParams());
	}

	public void setBarColor(int color)
	{
		// background of the extended CollapsingToolbarLayout if no image is visible
		barColor = color;
		if (collapseToolbarLayout != null) collapseToolbarLayout.setBackgroundColor(color);
	}

	public void setColor(int color)
	{
		// color of the text
		textColor = color;
		if (collapseToolbarLayout != null) {
			collapseToolbarLayout.setExpandedTitleColor(color);
			collapseToolbarLayout.setCollapsedTitleTextColor(color);
		}
	}

	public void setNavigationIconColor(int color)
	{
		// color of the text
		navigationColor = color;
		if (toolbar != null && navigationColor != -1) {
			toolbar.setNavigationIconTint(navigationColor);
		}
	}

	public void setContentScrimColor(int color)
	{
		// color of the collapsed toolbar
		contentScrimColor = color;
		if (collapseToolbarLayout != null) {
			collapseToolbarLayout.setContentScrimColor(color);
		}
	}

	public void setonHomeIconItemSelected(KrollFunction value)
	{
		homeIconFunction = value;
	}

	public void setTitle(String title)
	{
		if (collapseToolbarLayout != null) collapseToolbarLayout.setTitle(title);
	}

	public void setDisplayHomeAsUp(boolean value)
	{
		if (collapseToolbarLayout != null && toolbar != null && value) {
			toolbar.setNavigationIcon(R.drawable.ic_action_back);
			if (navigationColor != -1) {
				setNavigationIconColor(navigationColor);
			}
			toolbar.setNavigationOnClickListener(v -> {
				if (homeIconFunction != null) {
					homeIconFunction.callAsync(proxy.getKrollObject(), new Object[] {});
				}
			});
		}
		homeAsUp = value;
	}

	public void setImage(Bitmap bitmap)
	{
		if (bitmap == null) {
			imageView.setVisibility(View.INVISIBLE);
			return;
		}
		// if there is an image: set it and show it
		imageView.setImageBitmap(bitmap);
		imageView.setVisibility(View.VISIBLE);
	}

	private void setContainerHeight(int height)
	{
		// height of the extended CollapsingToolbarLayout
		ViewGroup.LayoutParams layout = collapseToolbarLayout.getLayoutParams();
		TiDimension nativeSize = TiConvert.toTiDimension(TiConvert.toString(height), TiDimension.TYPE_HEIGHT);
		layout.height = nativeSize.getAsPixels(collapseToolbarLayout);
		collapseToolbarLayout.setLayoutParams(layout);
	}

	public void setFlags(int value)
	{
		if (collapseToolbarLayout != null) {
			AppBarLayout.LayoutParams params =
				(AppBarLayout.LayoutParams) collapseToolbarLayout.getLayoutParams();
			params.setScrollFlags(value);
		}
		scrollFlags = value;
	}

	public void setImageHeight(int height)
	{
		// height of the image inside the CollapsingToolbarLayout
		if (imageView != null) {
			TiDimension wDimension = TiConvert.toTiDimension(height, TiDimension.TYPE_WIDTH);
			ViewGroup.LayoutParams layout = imageView.getLayoutParams();
			layout.height = wDimension.getAsPixels(imageView);
			imageView.setLayoutParams(layout);
		}
		imageHeight = height;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		Activity activity = TiApplication.getAppCurrentActivity();

		if (d.containsKey(TiC.PROPERTY_BAR_COLOR)) {
			setBarColor(TiConvert.toColor(d.getString(TiC.PROPERTY_BAR_COLOR), activity));
		}
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			Bitmap bmp = TiDrawableReference.fromObject(activity,
				d.get(TiC.PROPERTY_IMAGE)).getBitmap(false);
			setImage(bmp);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			setTitle(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_HEIGHT)) {
			setContainerHeight(d.getInt(TiC.PROPERTY_HEIGHT));
		}
		if (d.containsKey(TiC.PROPERTY_CONTENT_VIEW)) {
			setContentView((TiViewProxy) d.get(TiC.PROPERTY_CONTENT_VIEW));
		}
		if (d.containsKey("contentScrimColor")) {
			setContentScrimColor(TiConvert.toColor(d.getString("contentScrimColor"), activity));
		}
		if (d.containsKey("imageHeight")) {
			setImageHeight(d.getInt("imageHeight"));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			setColor(TiConvert.toColor(d.getString(TiC.PROPERTY_COLOR), activity));
		}
		if (d.containsKey(TiC.PROPERTY_NAVIGATION_ICON_COLOR)) {
			setNavigationIconColor(TiConvert.toColor(d.getString(TiC.PROPERTY_NAVIGATION_ICON_COLOR), activity));
		}
	}
}
