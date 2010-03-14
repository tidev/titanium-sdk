/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.analytics;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.util.TiConvert;

public class AnalyticsModule extends TiModule {

	public AnalyticsModule(TiContext tiContext) {
		super(tiContext);
	}

	public void addEvent(Object[] args)
	{
		if (args.length < 2) {
			throw new IllegalArgumentException("navEvent requires at least a name and type");
		}

		String type = TiConvert.toString(args[0]);
		String event = TiConvert.toString(args[1]);
		TiDict data = null;

		if (args.length > 2) {
			data = (TiDict) args[3];
		} else {
			data = new TiDict();
		}

		localAddEvent(type, event, data);
	}

	private void localAddEvent(String type, String event, TiDict data)
	{
		getTiContext().getTiApp().postAnalyticsEvent(TiAnalyticsEventFactory.createEvent(type, event, TiConvert.toJSON(data).toString()));
	}

	public void navEvent(Object[] args) {
		if (args.length < 2) {
			throw new IllegalArgumentException("navEvent requires at least a from and to");
		}

		TiDict payload = new TiDict();

		payload.put("from",TiConvert.toString(args[0]));
		payload.put("to",TiConvert.toString(args[1]));
		payload.put("event", args.length > 2 ? args[2] : "");
		payload.put("data",args.length > 3 ? args[3] : new TiDict());

		localAddEvent("app.nav", payload.getString("event"), payload);
	}

	public void timedEvent(Object[] args)
	{
		if (args.length < 4) {
			throw new IllegalArgumentException("timedEvent requires at least a name, start, stop, and duration.");
		}

		TiDict payload = new TiDict();

		payload.put("event",TiConvert.toString(args[0]));
		payload.put("start",args[1]);
		payload.put("stop", args[2]);
		payload.put("duration", args[3]);
		payload.put("data",args.length > 4 ? args[4] : new TiDict());

		localAddEvent("app.timed", payload.getString("event"), payload);
	}

	public void featureEvent(Object[] args) {
		String event = TiConvert.toString(args[0]);
		TiDict data = null;
		if (args.length > 1) {
			data = (TiDict) args[1];
		} else {
			data = null;
		}

		localAddEvent("app.feature", event, data);
	}

	public void settingsEvent(Object[] args) {
		String event = TiConvert.toString(args[0]);
		TiDict data = null;
		if (args.length > 1) {
			data = (TiDict) args[1];
		} else {
			data = null;
		}

		localAddEvent("app.settings", event, data);
	}

	public void userEvent(Object[] args) {
		String event = TiConvert.toString(args[0]);
		TiDict data = null;
		if (args.length > 1) {
			data = (TiDict) args[1];
		} else {
			data = null;
		}

		localAddEvent("app.user", event, data);
	}
}
