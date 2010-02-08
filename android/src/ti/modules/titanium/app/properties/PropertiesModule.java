package ti.modules.titanium.app.properties;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

public class PropertiesModule extends TiModule {

	private static final String LCAT = "PropertiesModule";
	private TiProperties appProperties;
	
	public PropertiesModule(TiContext tiContext) {
		super(tiContext);
		
		appProperties = tiContext.getTiApp().getAppProperties();
	}

	public boolean getBool(String key, boolean def) {
		return appProperties.getBool(key, def);
	}

	public double getDouble(String key, double def) {
		return appProperties.getDouble(key, def);
	}

	public int getInt(String key, int def) {
		return appProperties.getInt(key, def);
	}

	public Object[] getList(String key, Object[] def) {
		String[] defList = new String[0];
		if (def != null) {
			defList = new String[def.length];
			for (int i = 0; i < def.length; i++) {
				defList[i] = def.toString();
			}
		}
		
		//auto transform JSON data into objects
		String values[] = appProperties.getList(key, defList);
		Object list[] = new Object[values.length];
		for (int i = 0; i < values.length; i++) {
			String value = values[i];
			if (value.startsWith("{") && value.endsWith("}")) {
				try {
					list[i] = new TiDict(new JSONObject(value));
				} catch (JSONException e) {
					Log.w(LCAT, "Error converting JSON string to TiDict: " + value);
				}
			} else {
				list[i] = value;
			}
		}
		return list;
	}

	public String getString(String key, String def) {
		return appProperties.getString(key, def);
	}

	public boolean hasProperty(String key) {
		return appProperties.hasProperty(key);
	}

	public String[] listProperties() {
		return appProperties.listProperties();
	}

	public void removeProperty(String key) {
		appProperties.removeProperty(key);
	}

	public void setBool(String key, boolean value) {
		appProperties.setBool(key, value);
	}

	public void setDouble(String key, double value) {
		appProperties.setDouble(key, value);
	}

	public void setInt(String key, int value) {
		appProperties.setInt(key, value);
	}

	public void setList(String key, Object[] value) {
		String[] valueList = new String[value.length];
		for (int i = 0; i < value.length; i++) {
			valueList[i] = value[i].toString();
		}
		appProperties.setList(key, valueList);
	}

	public void setString(String key, String value) {
		appProperties.setString(key, value);
	}
	
	
}
