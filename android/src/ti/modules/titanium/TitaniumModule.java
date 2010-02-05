package ti.modules.titanium;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;

public class TitaniumModule
	extends TiModule
{
	private static final String LCAT = "TitaniumModule";
	private static TiDict constants;

	public TitaniumModule(TiContext tiContext) {
		super(tiContext);

	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("version", "0.9.0");
		}

		return constants;
	}

	public void include(Object[] files) {
		for(Object filename : files) {
			try {
				getTiContext().evalFile((String)filename);
			} catch (IOException e) {
				Log.e(LCAT, "Error while evaluating: " + filename, e);
			}
		}
	}
	
	private HashMap<Integer, Timer> timers = new HashMap<Integer, Timer>();
	private int currentTimerId;
	
	public int setTimeout(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		// TODO: we should handle evaluatable code eventually too..
		Log.d(LCAT, "got setTimeout @" + new Date().getTime());
		if (fn instanceof KrollCallback) {
			final KrollCallback callback = (KrollCallback) fn;
			Timer timer = new Timer();
			final int timerId = currentTimerId++;

			timers.put(timerId, timer);
			timer.schedule(new TimerTask(){
				@Override
				public void run() {
					Log.d(LCAT, "calling timer " + timerId + " @" + new Date().getTime());
					callback.call(args);
					timers.remove(timerId);
				}
			}, timeout);
			return timerId;
		}
		else throw new IllegalArgumentException("Don't know how to call callback of type: " + fn.getClass().getName());
	}
	
	public void clearTimeout(int timerId) {
		if (timers.containsKey(timerId)) {
			Timer timer = timers.remove(timerId);
			timer.cancel();
		}
	}
	
	public int setInterval(Object fn, long timeout, final Object[] args)
		throws IllegalArgumentException
	{
		// TODO: we should handle evaluatable code eventually too..
		Log.d(LCAT, "got setInterval @" + new Date().getTime());
		if (fn instanceof KrollCallback) {
			final KrollCallback callback = (KrollCallback) fn;
			Timer timer = new Timer();
			final int timerId = currentTimerId++;
	
			timers.put(timerId, timer);
			timer.schedule(new TimerTask(){
				@Override
				public void run() {
					Log.d(LCAT, "calling interval timer " + timerId + " @" + new Date().getTime());
					callback.call(args);
				}
			}, timeout, timeout);
			return timerId;
		}
		else throw new IllegalArgumentException("Don't know how to call callback of type: " + fn.getClass().getName());
	}
	
	public void clearInterval(int timerId) {
		clearTimeout(timerId);
	}
}
