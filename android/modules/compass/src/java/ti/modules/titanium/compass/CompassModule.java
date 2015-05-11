package ti.module.compass;
 
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiSensorHelper;
 
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
 
@Kroll.module(name="Compass", id="ti.module.compass")
public class CompassModule extends KrollModule implements SensorEventListener
{
 
	private static final String EVENT_UPDATE = "update";    
	private boolean compassRegistered = false;
	private long lastEventInUpdate;
	private float lastHeading = 0.0f;
 
	public CompassModule()
	{
	    super();
	}
 
	public CompassModule(TiContext tiContext)
	{
	    this();
	}
 
	@Override
	public void eventListenerAdded(String type, int count, final KrollProxy proxy)
	{
	    if (!compassRegistered) {
		if (EVENT_UPDATE.equals(type)) {
		    TiSensorHelper.registerListener(Sensor.TYPE_ORIENTATION, this, SensorManager.SENSOR_DELAY_FASTEST);
		    compassRegistered = true;
		}
	    }
	    super.eventListenerAdded(type, count, proxy);
	}
 
	@Override
	public void eventListenerRemoved(String type, int count, KrollProxy proxy)
	{
	    if (compassRegistered) {
		if (EVENT_UPDATE.equals(type)) {
		    TiSensorHelper.unregisterListener(Sensor.TYPE_ORIENTATION, this);
		    compassRegistered = false;
		}
	    }
	    super.eventListenerRemoved(type, count, proxy);
	}
 
	public void onAccuracyChanged(Sensor sensor, int accuracy)
	{
	}
 
	public void onSensorChanged(SensorEvent event)
	{
	    if (event.sensor.getType() == Sensor.TYPE_ORIENTATION) 
	    {
		long eventTimestamp = event.timestamp / 1000000;
 
		if (eventTimestamp - lastEventInUpdate > 250) 
		{		   
		    lastEventInUpdate = eventTimestamp;
		    lastHeading = event.values[0];		  
 
		    KrollDict data = new KrollDict();
		    data.put("magneticHeading", lastHeading);
		    fireEvent(EVENT_UPDATE, data);		  
		}	       
	    }		   

	}       
}
