package <%- appid %>;

import ti.modules.titanium.android.TiJSActivity;

public final class <%- activity.classname %> extends TiJSActivity
{
	@Override
	public String getUrl()
	{
		return "<%- activity.url %>";
	}
}
