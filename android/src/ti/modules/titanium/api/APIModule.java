package ti.modules.titanium.api;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;

public class APIModule extends TiModule
{
	private static final String LCAT = "TiAPI";

	private static TiDict constants;

	public static final int TRACE = 1;
	public static final int DEBUG = 2;
	public static final int INFO = 3;
	public static final int NOTICE = 4;
	public static final int WARN = 5;
	public static final int ERROR = 6;
	public static final int CRITICAL = 7;
	public static final int FATAL = 8;

	public APIModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("TRACE", TRACE);
			constants.put("DEBUG", DEBUG);
			constants.put("INFO", INFO);
			constants.put("NOTICE", NOTICE);
			constants.put("WARN", WARN);
			constants.put("ERROR", ERROR);
			constants.put("CRITICAL", CRITICAL);
			constants.put("FATAL", FATAL);
		}

		return constants;
	}

	public void debug(String msg) {
		Log.d(LCAT, msg);
	}

	public void info(String msg) {
		Log.i(LCAT, msg);
	}

	public void warn(String msg) {
		Log.w(LCAT, msg);
	}

	public void error(String msg) {
		Log.e(LCAT, msg);
	}

	public void trace(String msg) {
		Log.d(LCAT, msg);
	}

	public void notice(String msg) {
		Log.i(LCAT, msg);
	}

	public void critical(String msg) {
		Log.e(LCAT, msg);
	}

	public void fatal(String msg) {
		Log.e(LCAT, msg);
	}

	public void log(String level, String msg)
	{
		String ulevel = level.toUpperCase();
		int severity = INFO;

		if ("TRACE".equals(ulevel)) {
			severity = TRACE;
		} else if ("DEBUG".equals(ulevel)) {
			severity = DEBUG;
		} else if ("INFO".equals(ulevel)) {
			severity = INFO;
		} else if ("NOTICE".equals(ulevel)) {
			severity = NOTICE;
		} else if ("WARN".equals(ulevel)) {
			severity = WARN;
		} else if ("ERROR".equals(ulevel)) {
			severity = ERROR;
		} else if ("CRITICAL".equals(ulevel)) {
			severity = CRITICAL;
		} else if ("FATAL".equals(ulevel)) {
			severity = FATAL;
		} else {
			msg = "[" + level + "] " + msg;
		}

		internalLog(severity, msg);
	}

	public void internalLog(int severity, String msg)
	{
		if (severity == TRACE)
		{
			Log.v(LCAT,msg);
		}
		else if (severity < INFO)
		{
			Log.d(LCAT,msg);
		}
		else if (severity < WARN)
		{
			Log.i(LCAT,msg);
		}
		else if (severity == WARN)
		{
			Log.w(LCAT,msg);
		}
		else
		{
			Log.e(LCAT,msg);
		}
	}
}
