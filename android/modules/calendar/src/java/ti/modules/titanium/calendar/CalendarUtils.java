package ti.modules.titanium.calendar;

import android.content.ContentValues;
import android.provider.CalendarContract;
import android.text.TextUtils;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import java.util.Collections;
import java.util.Date;

public class CalendarUtils
{
	public static final String TAG = "CalendarUtils";

	// Build the selection string for IN clause.
	public static String prepareQuerySelection(String columnName, int limit)
	{
		return columnName + " IN (" + TextUtils.join(", ", Collections.nCopies(limit, "?")) + ")";
	}

	// Creates String[] for selectionArgs.
	public static String[] prepareQueryArguments(Object[] data)
	{
		String[] queryArgs = new String[data.length];
		for (int i = 0; i < data.length; i++) {
			queryArgs[i] = String.valueOf(data[i]);
		}
		return queryArgs;
	}

	public static ContentValues createContentValues(CalendarProxy calendar, KrollDict data, EventProxy event)
	{
		if (!data.containsKey("title")) {
			return null;
		}

		ContentValues contentValues = new ContentValues();
		contentValues.put("hasAlarm", 1);
		contentValues.put("hasExtendedProperties", 1);

		event.title = TiConvert.toString(data, "title");
		contentValues.put("title", event.title);
		contentValues.put("calendar_id", calendar.getId());
		contentValues.put(CalendarContract.Events.EVENT_TIMEZONE, new Date().toString());

		if (data.containsKey(TiC.PROPERTY_LOCATION)) {
			event.location = TiConvert.toString(data, TiC.PROPERTY_LOCATION);
			contentValues.put(CalendarModule.EVENT_LOCATION, event.location);
		}
		if (data.containsKey("description")) {
			event.description = TiConvert.toString(data, "description");
			contentValues.put("description", event.description);
		}
		if (data.containsKey("begin")) {
			event.begin = TiConvert.toDate(data, "begin");
			if (event.begin != null) {
				contentValues.put("dtstart", event.begin.getTime());
			}
		}
		if (data.containsKey("end")) {
			event.end = TiConvert.toDate(data, "end");
			if (event.end != null) {
				contentValues.put("dtend", event.end.getTime());
			}
		}
		if (data.containsKey("allDay")) {
			event.allDay = TiConvert.toBoolean(data, "allDay");
			contentValues.put("allDay", event.allDay ? 1 : 0);
		}

		if (data.containsKey("hasExtendedProperties")) {
			event.hasExtendedProperties = TiConvert.toBoolean(data, "hasExtendedProperties");
			contentValues.put("hasExtendedProperties", event.hasExtendedProperties ? 1 : 0);
		}

		if (data.containsKey("hasAlarm")) {
			event.hasAlarm = TiConvert.toBoolean(data, "hasAlarm");
			contentValues.put("hasAlarm", event.hasAlarm ? 1 : 0);
		}

		return contentValues;
	}
}
