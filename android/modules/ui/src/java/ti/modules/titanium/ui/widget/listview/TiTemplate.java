package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;
import java.util.Set;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.LabelProxy;
import android.app.Activity;

public class TiTemplate {
	
	private static final String TAG = "TiTemplate";

	private HashMap<String, TiViewProxy> viewProxies;
	private HashMap<String, KrollDict> defaultProperties;
	
	public static final String DEFAULT_TEMPLATE = "defaultTemplate";
	public static final String DEFAULT_LABEL_BINDING = "title";
	public static final String DEFAULT_IMAGE_BINDING = "leftImage";

	
	private String templateID;
	private int templateType;
	
	private KrollDict cellProperties;
	private KrollDict properties;
	
	private TiListCell listCell;
	
	public TiTemplate(String id, KrollDict properties) {
		//Init our binding hashmaps
		viewProxies = new HashMap<String, TiViewProxy>();
		defaultProperties = new HashMap<String, KrollDict>();

		//Init vars.
		templateID = id;
		templateType = -1;
		cellProperties = new KrollDict();
		if (properties != null) {
			this.properties = properties;
			processProperties(this.properties);
		} else {
			this.properties = new KrollDict();
		}
	
	}
	
	private void processProperties(KrollDict properties) {
		if (properties.containsKey(TiC.PROPERTY_PROPERTIES)) {
			Object props = properties.get(TiC.PROPERTY_PROPERTIES);
			if (props instanceof HashMap) {
				cellProperties = new KrollDict((HashMap)props);
			}
		}
	}

	public String getTemplateID() {
		return templateID;
	}
	
	public KrollDict getCellProperties() {
		return cellProperties;
	}

	public void setType(int type) {
		templateType = type;
	}
	
	public int getType() {
		return templateType;
	}
	
	public void setListCell(TiListCell listCell) {
		this.listCell = listCell;
	}
	
	public TiListCell getListCell() {
		return listCell;
	}
	
	/**
	 * Returns the bound view proxy if exists, otherwise returns null
	 */
	public TiViewProxy getViewProxy(String binding) {
		if (viewProxies.containsKey(binding)) {
			return viewProxies.get(binding);
		}
		return null;
	}
	
	public void generateDefaultProps(Activity activity) {
		//Init default properties for our proxies
		KrollDict defaultLabelProperties = new KrollDict();
		KrollDict defaultImageProperties = new KrollDict();

		//Generate label proxy
		LabelProxy labelProxy = new LabelProxy();
		labelProxy.setActivity(activity);
		//Generate properties
		defaultLabelProperties.put("left", "30%");
		defaultLabelProperties.put("text", "label");
		//bind the proxy and default properties
		viewProxies.put(DEFAULT_LABEL_BINDING, labelProxy);
		defaultProperties.put(DEFAULT_LABEL_BINDING, defaultLabelProperties);
		
		//Generate image proxy
		ImageViewProxy imageProxy = new ImageViewProxy();
		imageProxy.setActivity(activity);
		//Generate properties
		defaultImageProperties.put("left", "0");
		defaultImageProperties.put("height", "100");
		defaultImageProperties.put("width", "100");
		//bind the proxy and default properties
		viewProxies.put(DEFAULT_IMAGE_BINDING, imageProxy);
		defaultProperties.put(DEFAULT_IMAGE_BINDING, defaultImageProperties);

	}
	
	public void mergeAndUpdateDefaultProperties(String binding, KrollDict data) {
		KrollDict existingProperties = defaultProperties.get(binding);
		if (existingProperties == null) {
			Log.e(TAG, "existing properties not set!");
			return;
		} else {
			for (String key: data.keySet()) {
				if (key.equals(binding)) {
					KrollDict props = new KrollDict((HashMap)data.get(key));
					//update default properties
					updateDefaultProperties(existingProperties, props);
					//merge default properties with new properties and update data
					HashMap<String, Object> newData = ((HashMap<String, Object>)existingProperties.clone());
					newData.putAll(props);
					data.put(key, newData);
					return;
				}
			}
		}
	}
	
	public void updateDefaultProperties(KrollDict existingProperties, KrollDict newProperties) {
		Set<String> existingKeys = existingProperties.keySet();
		for (String key:  newProperties.keySet()) {
			if (!existingKeys.contains(key)) {
				existingProperties.put(key, null);
			}
		}

	}
}
