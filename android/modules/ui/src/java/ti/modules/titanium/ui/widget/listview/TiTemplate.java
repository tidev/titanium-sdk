package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;
import java.util.Set;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

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
	public static final String DEFAULT_CELL_ID = "cellID";

	//Identifier for template, specified in ListView creation dict
	private String templateID;
	//Internal identifier for template, each template has a unique type
	private int templateType;
	
	private String cellID;
	//Properties of the template. 
	private KrollDict properties;
	
	public TiTemplate(String id, KrollDict properties) {
		//Init our binding hashmaps
		viewProxies = new HashMap<String, TiViewProxy>();
		defaultProperties = new HashMap<String, KrollDict>();

		//Init vars.
		templateID = id;
		templateType = -1;
		if (properties != null) {
			this.properties = properties;
			processProperties(this.properties);
		} else {
			this.properties = new KrollDict();
		}
	
	}

	private void bindProxiesAndProperties(KrollDict properties, boolean isRootTemplate) {
		Object proxy = null;
		String id = null;
		Object props = null;
		if (properties.containsKey(TiC.PROPERTY_TYPE)) {
			proxy = properties.get(TiC.PROPERTY_TYPE);
		}

		if (properties.containsKey("ID")) {
			id = TiConvert.toString(properties, "ID");
			if (isRootTemplate) {
				cellID = id;
			}
		}

		if (id != null && proxy instanceof TiViewProxy) {
			viewProxies.put(id, (TiViewProxy) proxy);
		}

		if (properties.containsKey(TiC.PROPERTY_PROPERTIES)) {
			props = properties.get(TiC.PROPERTY_PROPERTIES);
		}
		
		if (id != null && props instanceof HashMap) {
			defaultProperties.put(id, new KrollDict((HashMap)props));
		} else if (props == null) {
			defaultProperties.put(id, new KrollDict());
		}
	}

	private void processProperties(KrollDict properties) {
		bindProxiesAndProperties(properties, true);
		if (properties.containsKey(TiC.PROPERTY_CHILD_TEMPLATES)) {
			processChildProperties(properties.get(TiC.PROPERTY_CHILD_TEMPLATES));
		}

	}
	
	private void processChildProperties(Object childProperties) {
		if (childProperties instanceof Object[]) {
			Object[] propertiesArray = (Object[])childProperties;
			for (int i = 0; i < propertiesArray.length; i++) {
				HashMap<String, Object> properties = (HashMap<String, Object>) propertiesArray[i];
				//bind proxies and default properties
				bindProxiesAndProperties(new KrollDict(properties), false);
				//Recursively calls for all childTemplates
				if (properties.containsKey(TiC.PROPERTY_CHILD_TEMPLATES)) {
					processChildProperties(properties.get(TiC.PROPERTY_CHILD_TEMPLATES));
				}
			}
		}
	}

	public String getTemplateID() {
		return templateID;
	}

	public void setType(int type) {
		templateType = type;
	}
	
	public int getType() {
		return templateType;
	}
	
	public String getCellID() {
		return cellID;
	}
	
	/**
	 * Returns the bound view proxy if exists.
	 */
	public TiViewProxy getViewProxy(String binding) {
		return viewProxies.get(binding);	
	}
	
	/**
	 * Returns the bound default properties if exists.
	 */
	public KrollDict getDefaultProperties(String binding) {
		return defaultProperties.get(binding);
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
		
		cellID = DEFAULT_CELL_ID;
		//Generate cell proxy
		ListCellProxy proxy = new ListCellProxy();
		proxy.setActivity(activity);
		viewProxies.put(cellID, proxy);
		defaultProperties.put(cellID, new KrollDict());

	}
	
	/**
	 * 
	 * @param data
	 */
	public void mergeAndUpdateDefaultProperties(KrollDict data) {
		
		for (String binding: data.keySet()) {
			KrollDict defaultProps = defaultProperties.get(binding);
			KrollDict props = new KrollDict((HashMap)data.get(binding));
			if (defaultProps != null) {
				//update default properties
				updateDefaultProperties(defaultProps, props);
				//merge default properties with new properties and update data
				HashMap<String, Object> newData = ((HashMap<String, Object>)defaultProps.clone());
				newData.putAll(props);
				data.put(binding, newData);
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
