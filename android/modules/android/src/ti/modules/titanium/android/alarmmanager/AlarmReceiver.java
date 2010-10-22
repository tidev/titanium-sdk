/**
 * 
 */
package ti.modules.titanium.android.alarmmanager;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiDict;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * @author dthorp
 *
 */
public class AlarmReceiver extends BroadcastReceiver 
{

	public AlarmReceiver() 
	{
	}

	@Override
	public void onReceive(Context context, Intent intent) 
	{
		TiDict d = new TiDict();
		TiApplication app = (TiApplication) context.getApplicationContext();
		if (intent != null) {
			if (intent.hasExtra("alarmData")) {
				d.put("alarmData", intent.getStringExtra("alarmData"));
			}
		}
		app.fireAppEvent("android:alarm", d);
	}
}
