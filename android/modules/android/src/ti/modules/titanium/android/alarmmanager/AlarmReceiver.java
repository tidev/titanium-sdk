/**
 * 
 */
package ti.modules.titanium.android.alarmmanager;

import org.appcelerator.titanium.TiApplication;

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
	public void onReceive(Context context, Intent intent) {
		TiApplication app = (TiApplication) context.getApplicationContext();
		app.fireAppEvent("android:alarm", null);
	}
}
