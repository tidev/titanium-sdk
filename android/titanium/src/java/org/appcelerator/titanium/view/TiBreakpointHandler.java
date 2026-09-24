/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import android.app.Activity;
import android.content.res.Configuration;
import androidx.annotation.NonNull;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

/**
 * Applies the "breakpoints" property of a view, similar to CSS media queries.
 * <p>
 * Each breakpoint defines optional "minWidth", "maxWidth", "minHeight" and "maxHeight" values
 * in dp which are compared against the activity's window size. The "properties" of all
 * matching breakpoints are applied to the view in array order. When a breakpoint no longer
 * matches, the view's original property values are restored.
 */
public class TiBreakpointHandler implements TiBaseActivity.ConfigurationChangedListener
{
	private static final String TAG = "TiBreakpointHandler";

	private static class Breakpoint
	{
		int minWidth = Integer.MIN_VALUE;
		int maxWidth = Integer.MAX_VALUE;
		int minHeight = Integer.MIN_VALUE;
		int maxHeight = Integer.MAX_VALUE;
		HashMap<String, Object> properties = new HashMap<>();

		boolean matches(int width, int height)
		{
			return (width >= minWidth) && (width <= maxWidth) && (height >= minHeight) && (height <= maxHeight);
		}
	}

	private final TiViewProxy proxy;
	private final List<Breakpoint> breakpoints = new ArrayList<>();
	private final LinkedHashSet<String> managedKeys = new LinkedHashSet<>();
	private final HashMap<String, Object> baseValues = new HashMap<>();
	private final HashMap<String, Object> appliedValues = new HashMap<>();
	private List<Integer> lastMatches = null;
	private WeakReference<TiBaseActivity> activityRef;

	public TiBreakpointHandler(@NonNull TiViewProxy proxy)
	{
		this.proxy = proxy;
	}

	/**
	 * Replaces the current breakpoints with the given ones and applies them.
	 * @param value The "breakpoints" property value. Expected to be an array of dictionaries.
	 */
	public void setBreakpoints(Object value)
	{
		// Restore the original values before switching to the new rules.
		syncBaseValues();
		applyValues(this.baseValues);
		this.breakpoints.clear();
		this.managedKeys.clear();
		this.baseValues.clear();
		this.appliedValues.clear();
		this.lastMatches = null;

		if (value instanceof Object[]) {
			for (Object item : (Object[]) value) {
				Breakpoint breakpoint = parseBreakpoint(item);
				if (breakpoint != null) {
					this.breakpoints.add(breakpoint);
					this.managedKeys.addAll(breakpoint.properties.keySet());
				}
			}
		} else if (value != null) {
			Log.w(TAG, "Property '" + TiC.PROPERTY_BREAKPOINTS + "' must be an array.");
		}

		if (this.breakpoints.isEmpty()) {
			detach();
			return;
		}
		attach();

		Activity currentActivity = this.proxy.getActivity();
		if (currentActivity != null) {
			update(currentActivity.getResources().getConfiguration());
		}
	}

	/**
	 * Stops listening to window size changes. To be called when the view is released.
	 */
	public void release()
	{
		detach();
		this.breakpoints.clear();
		this.managedKeys.clear();
		this.baseValues.clear();
		this.appliedValues.clear();
	}

	@Override
	public void onConfigurationChanged(TiBaseActivity activity, Configuration newConfig)
	{
		update(newConfig);
	}

	private void update(Configuration config)
	{
		int width = config.screenWidthDp;
		int height = config.screenHeightDp;
		if ((width == Configuration.SCREEN_WIDTH_DP_UNDEFINED)
			|| (height == Configuration.SCREEN_HEIGHT_DP_UNDEFINED)) {
			return;
		}

		// Do nothing if the same breakpoints match as before.
		List<Integer> matches = new ArrayList<>();
		for (int index = 0; index < this.breakpoints.size(); index++) {
			if (this.breakpoints.get(index).matches(width, height)) {
				matches.add(index);
			}
		}
		if (matches.equals(this.lastMatches)) {
			return;
		}
		this.lastMatches = matches;

		// Merge original values with the properties of all matching breakpoints. Last one wins.
		syncBaseValues();
		HashMap<String, Object> targetValues = new HashMap<>(this.baseValues);
		for (int index : matches) {
			targetValues.putAll(this.breakpoints.get(index).properties);
		}
		applyValues(targetValues);
	}

	/**
	 * Stores the view's current values as its original values, unless they were set by a breakpoint.
	 * This keeps values assigned from JavaScript after a breakpoint was applied.
	 */
	private void syncBaseValues()
	{
		for (String key : this.managedKeys) {
			Object currentValue = this.proxy.getProperty(key);
			if (!this.baseValues.containsKey(key)) {
				this.baseValues.put(key, currentValue);
			} else if (this.appliedValues.containsKey(key)
					   && !Objects.equals(currentValue, this.appliedValues.get(key))) {
				this.baseValues.put(key, currentValue);
			}
		}
	}

	private void applyValues(Map<String, Object> values)
	{
		HashMap<String, Object> changes = new HashMap<>();
		for (Map.Entry<String, Object> entry : values.entrySet()) {
			if (!Objects.equals(this.proxy.getProperty(entry.getKey()), entry.getValue())) {
				changes.put(entry.getKey(), entry.getValue());
			}
		}
		this.appliedValues.putAll(values);
		if (!changes.isEmpty()) {
			this.proxy.applyProperties(changes);
		}
	}

	private Breakpoint parseBreakpoint(Object item)
	{
		if (!(item instanceof HashMap)) {
			Log.w(TAG, "Each breakpoint must be a dictionary.");
			return null;
		}
		HashMap<?, ?> dict = (HashMap<?, ?>) item;
		Object properties = dict.get(TiC.PROPERTY_PROPERTIES);
		if (!(properties instanceof HashMap)) {
			Log.w(TAG, "Breakpoint is missing the '" + TiC.PROPERTY_PROPERTIES + "' dictionary.");
			return null;
		}

		Breakpoint breakpoint = new Breakpoint();
		breakpoint.minWidth = TiConvert.toInt(dict.get(TiC.PROPERTY_MIN_WIDTH), Integer.MIN_VALUE);
		breakpoint.maxWidth = TiConvert.toInt(dict.get(TiC.PROPERTY_MAX_WIDTH), Integer.MAX_VALUE);
		breakpoint.minHeight = TiConvert.toInt(dict.get(TiC.PROPERTY_MIN_HEIGHT), Integer.MIN_VALUE);
		breakpoint.maxHeight = TiConvert.toInt(dict.get(TiC.PROPERTY_MAX_HEIGHT), Integer.MAX_VALUE);
		for (Map.Entry<?, ?> entry : ((HashMap<?, ?>) properties).entrySet()) {
			String key = TiConvert.toString(entry.getKey());
			if (key != null && !key.equals(TiC.PROPERTY_BREAKPOINTS)) {
				breakpoint.properties.put(key, entry.getValue());
			}
		}
		return breakpoint;
	}

	private void attach()
	{
		Activity currentActivity = this.proxy.getActivity();
		TiBaseActivity newActivity =
			(currentActivity instanceof TiBaseActivity) ? (TiBaseActivity) currentActivity : null;
		TiBaseActivity oldActivity = (this.activityRef != null) ? this.activityRef.get() : null;
		if (newActivity == oldActivity) {
			return;
		}
		detach();
		if (newActivity != null) {
			this.activityRef = new WeakReference<>(newActivity);
			newActivity.addConfigurationChangedListener(this);
		}
	}

	private void detach()
	{
		TiBaseActivity oldActivity = (this.activityRef != null) ? this.activityRef.get() : null;
		if (oldActivity != null) {
			oldActivity.removeConfigurationChangedListener(this);
		}
		this.activityRef = null;
	}
}
