package ti.modules.titanium.calendar;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_EMAIL,
	TiC.PROPERTY_NAME,
	TiC.PROPERTY_STATUS,
	TiC.PROPERTY_TYPE,
	TiC.PROPERTY_RELATIONSHIP
})
public class AttendeeProxy extends KrollProxy
{
	public AttendeeProxy()
	{
		super();
	}

	public AttendeeProxy(String email, String name, int status, int type, int relationship)
	{
		setProperty(TiC.PROPERTY_EMAIL, email);
		setProperty(TiC.PROPERTY_NAME, name);
		setProperty(TiC.PROPERTY_STATUS, status);
		setProperty(TiC.PROPERTY_TYPE, type);
		setProperty(TiC.PROPERTY_RELATIONSHIP, relationship);
	}
}
