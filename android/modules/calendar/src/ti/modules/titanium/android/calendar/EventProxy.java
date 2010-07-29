package ti.modules.titanium.android.calendar;

import java.util.Date;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

public class EventProxy extends TiProxy {
	
	protected String title;
	protected Date begin, end;
	protected boolean allDay;
	
	public EventProxy(TiContext context, String title, Date begin, Date end, boolean allDay) {
		super(context);
		
		this.title = title;
		this.begin = begin;
		this.end = end;
		this.allDay = allDay;
	}

	public String getTitle() {
		return title;
	}

	public Date getBegin() {
		return begin;
	}

	public Date getEnd() {
		return end;
	}

	public boolean isAllDay() {
		return allDay;
	}
}
