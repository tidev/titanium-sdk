/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.alarmmanager;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.android.PendingIntentProxy;
import android.app.Activity;
import android.app.AlarmManager;

public class AlarmManagerModule extends TiModule
{
	private static final String LCAT = "TiAndroidAlarmMgr";

	private static final int MODE_EXACT = 0;
	private static final int MODE_INEXACT_REPEATING = 1;
	private static final int MODE_REPEATING = 2;
	
	private static TiDict constants;

	public AlarmManagerModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("ELAPSED_REALTIME", AlarmManager.ELAPSED_REALTIME);
			constants.put("ELAPSED_REALTIME_WAKEUP", AlarmManager.ELAPSED_REALTIME_WAKEUP);
			constants.put("INTERVAL_DAY", AlarmManager.INTERVAL_DAY);
			constants.put("INTERVAL_FIFTEEN_MINUTES", AlarmManager.INTERVAL_FIFTEEN_MINUTES);
			constants.put("INTERVAL_HALF_DAY", AlarmManager.INTERVAL_HALF_DAY);
			constants.put("INTERVAL_HALF_HOUR", AlarmManager.INTERVAL_HALF_HOUR);
			constants.put("INTERVAL_HOUR", AlarmManager.INTERVAL_HOUR);
			constants.put("RTC", AlarmManager.RTC);
			constants.put("RTC_WAKEUP", AlarmManager.RTC_WAKEUP);
			
			constants.put("MODE_EXACT", MODE_EXACT);
			constants.put("MODE_INEXACT_REPEATING", MODE_INEXACT_REPEATING);
			constants.put("MODE_REPEATING", MODE_REPEATING);
		}

		return constants;
	}

	private AlarmManager getManager() {
		return (AlarmManager) getTiContext().getActivity().getApplicationContext().getSystemService(Activity.ALARM_SERVICE);
	}
	
	public void cancelAlarm(PendingIntentProxy operationProxy) {
		getManager().cancel(operationProxy.getPendingIntent());
	}
	
	public void setAlarm(TiDict d) 
	{
		int mode = MODE_EXACT;
		int type = AlarmManager.RTC;
		long triggerAt = System.currentTimeMillis();
		long interval = 0;
		PendingIntentProxy operationProxy = null;
		
		if (d.containsKey("type")) {
			type = TiConvert.toInt(d, "type");
		}
		if (d.containsKey("mode")) {
			mode = TiConvert.toInt(d, "mode");
		}
		if (d.containsKey("triggerAt")) {
			triggerAt = ((Double) TiConvert.toDouble(d, "triggerAt")).longValue();
		}
		if (d.containsKey("interval")) {
			interval = ((Double) TiConvert.toDouble(d, "interval")).longValue();
		}
		if (d.containsKey("operation")) {
			operationProxy = (PendingIntentProxy) d.get("operation");
		}
		
		if (operationProxy != null) {
			switch(mode) {
				case MODE_EXACT : {
					getManager().set(type, triggerAt, operationProxy.getPendingIntent());
					break;
				}
				case MODE_INEXACT_REPEATING : {
					getManager().setInexactRepeating(type, triggerAt, interval, operationProxy.getPendingIntent());
					break;
				}
				case MODE_REPEATING : {
					getManager().setRepeating(type, triggerAt, interval, operationProxy.getPendingIntent());
					break;
				}
				default : {
					Log.e(LCAT, "Invalid mode: " + mode);
				}
			}
		} else {
			Log.e(LCAT, "You must provide a PendingIntent with the operation property.");
		}
	}
}
