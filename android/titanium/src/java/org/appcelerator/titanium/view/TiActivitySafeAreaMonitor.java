/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import android.graphics.Rect;
import android.os.Build;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import java.util.ArrayList;

/** Tracks safe-area inset changes for a given activity. */
public class TiActivitySafeAreaMonitor
{
	/**
	 * Listener which gets invoked by "TiActivitySafeAreaMonitor" when its safe-area has changed.
	 * The updated safe-area can be retrieved by calling the monitor's getSafeAreaRect() method.
	 * <p>
	 * An instance of this type is expected to be passed to the setOnChangedListener() method.
	 */
	public interface OnChangedListener {
		void onChanged(TiActivitySafeAreaMonitor monitor);
	}

	/** The activity to be monitored. */
	private AppCompatActivity activity;

	/** Set true if monitor's start() method was called. Set false if stopped. */
	private boolean isRunning;

	/** Set true to add ActionBar height to top inset and exclude from safe-area. */
	private boolean isActionBarAddedAsInset;

	/** Collection of custom insets providers, such as a TabGroup bar's insets. */
	private ArrayList<TiInsetsProvider> insetsProviderCollection;

	/** Safe-area change listener given by the owner of this monitor. */
	private OnChangedListener changeListener;

	/** Listens for the root decor view's layout changes. */
	private View.OnLayoutChangeListener viewLayoutListener;

	/** Listens for the root decor view's inset changes. Will be null on Android 4.4 and older versions. */
	private View.OnApplyWindowInsetsListener viewInsetListener;

	/** Listens for custom insets changes from "TiInsetsProvider" objects. */
	private TiInsetsProvider.OnChangedListener insetsProviderListener;

	/** Pixel width of the inset overlapping the left side of the window's content. */
	private int insetLeft;

	/** Pixel height of the inset overlapping the top of the window's content. Does not include ActionBar height. */
	private int insetTop;

	/** Pixel width of the inset overlapping the right side of the window's content. */
	private int insetRight;

	/** Pixel height of the inset overlapping the bottom of the window's content. */
	private int insetBottom;

	/** Region between the screen insets in pixels, relative to the root decor view. */
	private Rect safeArea;

	/**
	 * Creates an object used to track safe-area region changes for the given activity.
	 * @param activity The activity to be monitored. Cannot be null.
	 */
	public TiActivitySafeAreaMonitor(AppCompatActivity activity)
	{
		// Validate.
		if (activity == null) {
			throw new NullPointerException();
		}

		// Initialize member variables.
		this.activity = activity;
		this.isActionBarAddedAsInset = true;
		this.insetsProviderCollection = new ArrayList<>(8);

		// Set up a listener for root decor view's layout changes.
		this.viewLayoutListener = new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(View view, int left, int top, int right, int bottom, int oldLeft, int oldTop,
									   int oldRight, int oldBottom)
			{
				// Updates safe-area based on view's newest size and position.
				// Note: On Android 4.4 and below, we have to poll for inset on every layout change.
				if (TiActivitySafeAreaMonitor.this.viewInsetListener != null) {
					updateUsingCachedInsets();
				} else {
					update();
				}
			}
		};

		// Set up a listener for root decor view's inset changes.
		// Note: This is only available on Android 5.0 and higher.
		if (Build.VERSION.SDK_INT >= 20) {
			this.viewInsetListener = new View.OnApplyWindowInsetsListener() {
				@Override
				public WindowInsets onApplyWindowInsets(View view, WindowInsets insets)
				{
					// Validate.
					if (view == null) {
						return insets;
					}

					// Update safe-area using given insets.
					updateUsing(insets);

					// Let the view handle the insets.
					// Allows the View.setFitsSystemWindows(true) method to work.
					return view.onApplyWindowInsets(insets);
				}
			};
		}

		// Set up a listener for custom TiInsetsProvider objects. (Used by Titanium TabGroups.)
		this.insetsProviderListener = new TiInsetsProvider.OnChangedListener() {
			@Override
			public void onChanged(TiInsetsProvider provider)
			{
				updateUsingCachedInsets();
			}
		};
	}

	/**
	 * Gets the activity that's being monitored.
	 * @return Returns the activity that's being monitored.
	 */
	public AppCompatActivity getActivity()
	{
		return this.activity;
	}

	/**
	 * Determines if ActionBar height (if shown) is added to the top inset and excluded from the safe-area.
	 * @return Returns true if ActionBar is added to the top inset. Returns false if ActionBar is ignored.
	 */
	public boolean isActionBarAddedAsInset()
	{
		return this.isActionBarAddedAsInset;
	}

	/**
	 * Sets whether or not the ActionBar height (if shown) should be added as a top inset
	 * and excluded from the safe-area. This is set true by default.
	 * <p>
	 * Expected to be set true when using Google's default ActionBar.
	 * <p>
	 * Intended to be set false when using a custom toolbar via AppCompatActivity.setSupportActionBar() since
	 * that toolbar will be part of the activity's content view.
	 * @param value Set true to add the ActionBar to the top inset. Set false to ignore ActionBar.
	 */
	public void setActionBarAddedAsInset(boolean value)
	{
		// Do not continue if setting is not changing.
		if (value == this.isActionBarAddedAsInset) {
			return;
		}

		// Store new setting and update safe-area.
		this.isActionBarAddedAsInset = value;
		update();
	}

	/**
	 * Adds an object used to provide custom insets to be excluded from the safe-area returned
	 * by this monitor's getSafeAreaRect() method.
	 * <p>
	 * For example, Titanium's TabGroup will use this feature to add its tab bar as a custom inset.
	 * <p>
	 * The provider's insets are expected to be relative to this activity's root decor view.
	 * @param provider Object used to provide custom insets. If given null, then this method will no-op.
	 */
	public void addInsetsProvider(TiInsetsProvider provider)
	{
		// Do not continue if given provider is invalid or already added.
		if ((provider == null) || this.insetsProviderCollection.contains(provider)) {
			return;
		}

		// Add the provider to the collection.
		this.insetsProviderCollection.add(provider);

		// Start listening for inset changes if this monitor is currently running.
		if (this.isRunning) {
			provider.setOnChangedListener(this.insetsProviderListener);
			updateUsingCachedInsets();
		}
	}

	/**
	 * Removes the provider added via the addInsetsProvider() method by reference.
	 * Once removed, the provider's insets will no longer apply to the safe-area.
	 * @param provider The insets provider to be removed by reference. Can be null.
	 */
	public void removeInsetsProvider(TiInsetsProvider provider)
	{
		// Remove the provider from the collection by reference.
		boolean wasRemoved = this.insetsProviderCollection.remove(provider);
		if (wasRemoved == false) {
			return;
		}

		// Detach this monitor's listener from the insets provider.
		if (provider.getOnChangedListener() == this.insetsProviderListener) {
			provider.setOnChangedListener(null);
		}

		// Update the safe-area.
		if (this.isRunning) {
			updateUsingCachedInsets();
		}
	}

	/**
	 * Gets the listener assigned via the setOnChangedListener() method.
	 * @return Returns the assigned listener. Returns null if no listener has been assigned.
	 */
	public TiActivitySafeAreaMonitor.OnChangedListener getOnChangedListener()
	{
		return this.changeListener;
	}

	/**
	 * Sets a listener to be invoked when the safe-area has changed.
	 * Given listener will only be invoked when the monitor has been started.
	 * @param listener The listener to be assigned. Can be set null to remove the last assigned listener.
	 */
	public void setOnChangedListener(TiActivitySafeAreaMonitor.OnChangedListener listener)
	{
		this.changeListener = listener;
	}

	/**
	 * Gets the activity's safe-area in pixels, relative to the root decor view.
	 * @return Returns the safe-area. Returns null if activity's root decor view is not attached.
	 */
	public Rect getSafeAreaRect()
	{
		// If this monitor is not currently running, then fetch the safe-area.
		if (this.isRunning == false) {
			update();
		}

		// If safe-are is null, then we were unable to fetch activity's root decor view.
		// This will happen if the activity has been destroyed before we had a chance to access it.
		if (this.safeArea == null) {
			return null;
		}

		// Return a copy of the cached safe-area.
		// We do this because the "Rect" class is mutable.
		return new Rect(this.safeArea);
	}

	/**
	 * Gets the activity's root decor view, if still available.
	 * @return Returns the activity's root decor view. Returns null if the activity has been destroyed.
	 */
	private View getDecorView()
	{
		Window window = this.activity.getWindow();
		if (window != null) {
			return window.getDecorView();
		}
		return null;
	}

	/**
	 * Fetches the ActionBar height, but only if shown and "isActionBarAddedAsInset" is set true.
	 * Intended to be added to the top inset height.
	 * @return Returns the ActionBar pixel height if applicable.
	 */
	private int getActionBarInsetHeight()
	{
		if (this.isActionBarAddedAsInset) {
			ActionBar actionBar = this.activity.getSupportActionBar();
			if ((actionBar != null) && actionBar.isShowing()) {
				return actionBar.getHeight();
			}
		}
		return 0;
	}

	/**
	 * Determines if this monitor has been started/stopped.
	 * @return
	 * Returns true if the start() method was called and this object is monitor for safe-area changes.
	 * <p>
	 * Returns false if the stop() method was called or monitor has never been started.
	 */
	public boolean isRunning()
	{
		return this.isRunning;
	}

	/**
	 * Starts listening for activity safe-area inset changes.
	 * This method is expected to be called after the Activity.onCreate() method has been called.
	 * <p>
	 * The listener passed to setOnChangedListener() won't be invoked until this monitor has been started.
	 */
	public void start()
	{
		// Do not continue if already started.
		if (this.isRunning) {
			return;
		}

		// Fetch the activity's root decor view, if still available.
		View rootView = getDecorView();
		if (rootView == null) {
			return;
		}

		// Subscribe to root view's events.
		this.isRunning = true;
		rootView.addOnLayoutChangeListener(this.viewLayoutListener);
		if (this.viewInsetListener != null) {
			rootView.setOnApplyWindowInsetsListener(this.viewInsetListener);
		}

		// Subscribe to custom inset providers.
		for (TiInsetsProvider provider : this.insetsProviderCollection) {
			provider.setOnChangedListener(this.insetsProviderListener);
		}

		// Fetch root view's current safe-area.
		update();
	}

	/**
	 * Stops listening for activity safe-area inset changes.
	 * <p>
	 * The listener passed to setOnChangedListener() won't be invoked while stopped.
	 */
	public void stop()
	{
		// Do not continue if already stopped.
		if (this.isRunning == false) {
			return;
		}

		// Flag this monitor as stopped.
		this.isRunning = false;

		// Unsubscribe from custom inset providers.
		for (TiInsetsProvider provider : this.insetsProviderCollection) {
			provider.setOnChangedListener(null);
		}

		// Unsubscribe from root view's events.
		View rootView = getDecorView();
		if (rootView != null) {
			rootView.removeOnLayoutChangeListener(this.viewLayoutListener);
			if (this.viewInsetListener != null) {
				rootView.setOnApplyWindowInsetsListener(null);
			}
		}
	}

	/**
	 * Updates this object's inset and safe-area member variables by fetching this info from the root view.
	 * <p>
	 * Will invoke the assigned OnChangedListener if the safe-area size/position has changed.
	 */
	private void update()
	{
		// Fetch the activity's root decor view, if still available.
		View rootView = getDecorView();
		if (rootView == null) {
			return;
		}

		// Fetch the currently applied insets and update safe-area.
		// Note: Google's internal code comments states that getWindowVisibleDisplayFrame() is "broken".
		//       It's proven to work for us, but let's avoid this API in case of any unknown edge cases.
		if (Build.VERSION.SDK_INT >= 23) {
			updateUsing(rootView.getRootWindowInsets());
		} else {
			Rect rect = new Rect(rootView.getLeft(), rootView.getTop(), rootView.getRight(), rootView.getBottom());
			rootView.getWindowVisibleDisplayFrame(rect);
			this.insetLeft = Math.max(rect.left - rootView.getLeft(), 0);
			this.insetTop = Math.max(rect.top - rootView.getTop(), 0);
			this.insetRight = Math.max(rootView.getRight() - rect.right, 0);
			this.insetBottom = Math.max(rootView.getBottom() - rect.bottom, 0);
			updateUsingCachedInsets();
		}
	}

	/**
	 * Updates this object's inset and safe-area member variables using the given Android window insets.
	 * Expected to be called when the root view's onApplyWindowInsets() method has been called.
	 * <p>
	 * Will invoke the assigned OnChangedListener if the safe-area size/position has changed.
	 */
	private void updateUsing(WindowInsets insets)
	{
		// Update using the system-window insets.
		// Note: Ignore the "stable" insets. They're used for fullscreen or immersive mode,
		//       indicating where the offscreen status bar and navigation bar will slide-in to.
		if (insets != null) {
			this.insetLeft = insets.getSystemWindowInsetLeft();
			this.insetTop = insets.getSystemWindowInsetTop();
			this.insetRight = insets.getSystemWindowInsetRight();
			this.insetBottom = insets.getSystemWindowInsetBottom();
		} else {
			this.insetLeft = 0;
			this.insetTop = 0;
			this.insetRight = 0;
			this.insetBottom = 0;
		}
		updateUsingCachedInsets();
	}

	/**
	 * Updates the stored safe-area using this object's currently assigned inset member variables.
	 * <p>
	 * Will invoke the assigned OnChangedListener if the safe-area size/position has changed.
	 */
	private void updateUsingCachedInsets()
	{
		// Fetch the activity's root decor view.
		View rootView = getDecorView();
		if (rootView == null) {
			return;
		}

		// Copy the system insets.
		int maxInsetLeft = this.insetLeft;
		int maxInsetTop = this.insetTop;
		int maxInsetRight = this.insetRight;
		int maxInsetBottom = this.insetBottom;

		// Add the ActionBar height, if enabled.
		maxInsetTop += getActionBarInsetHeight();

		// Apply any custom insets, if provided.
		// Ex: Used by Titanium TabGroups to provide top/bottom bar inset height.
		for (TiInsetsProvider provider : this.insetsProviderCollection) {
			maxInsetLeft = Math.max(provider.getLeft(), maxInsetLeft);
			maxInsetTop = Math.max(provider.getTop(), maxInsetTop);
			maxInsetRight = Math.max(provider.getRight(), maxInsetRight);
			maxInsetBottom = Math.max(provider.getBottom(), maxInsetBottom);
		}

		// Calculate the safe-area, which is the region between the insets.
		Rect rect = new Rect();
		rect.left = maxInsetLeft;
		rect.top = maxInsetTop;
		rect.right = rootView.getWidth() - maxInsetRight;
		rect.bottom = rootView.getHeight() - maxInsetBottom;

		// Make sure safe-area does not have a negative width and height.
		rect.bottom = Math.max(rect.top, rect.bottom);
		rect.right = Math.max(rect.left, rect.right);

		// Do not continue if the safe-area hasn't changed.
		if (rect.equals(this.safeArea)) {
			return;
		}

		// Update our cached safe-area member variable.
		this.safeArea = rect;

		// Notify owner that safe-area has changed.
		if (this.changeListener != null) {
			this.changeListener.onChanged(this);
		}
	}
}
