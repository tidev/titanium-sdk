package org.appcelerator.titanium.config;

import org.appcelerator.titanium.api.ITitaniumProperties;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import android.util.Config;
import android.util.Log;

public class TiAppXmlHandler extends DefaultHandler
{
	private static final String LCAT = "TiAppXmlHandler";
	@SuppressWarnings("unused")
	private static boolean DBG = Config.LOGD;

	protected static final String TYPE_STRING = "string";
	protected static final String TYPE_BOOL = "bool";
	protected static final String TYPE_INT = "int";
	protected static final String TYPE_DOUBLE = "double";

	protected TitaniumAppInfo tai;
	protected ITitaniumProperties prefs;

	protected int windowCounter; // Order needed for tabs

	protected boolean inWindows;
	protected boolean inModules;

	protected StringBuilder currentText;
	protected TitaniumWindowInfo currentWindow;
	protected TitaniumModuleInfo currentModule;
	protected String currentPropertyName;
	protected String currentPropertyType;

	public TiAppXmlHandler(TitaniumAppInfo tai)
	{
		this.tai = tai;
		this.prefs = tai.getSystemProperties();
	}

	@Override
	public void startDocument() throws SAXException {
		super.startDocument();
	}

	@Override
	public void startElement(String uri, String localName, String name,
			Attributes attributes) throws SAXException
	{
		super.startElement(uri, localName, name, attributes);
		if (inWindows) {
			if ("id".compareTo(localName) == 0 || "icon".compareTo(localName) == 0 ||
					"title".compareTo(localName) == 0 || "url".compareTo(localName) == 0 ||
					"type".compareTo(localName) == 0 || "size".compareTo(localName) == 0 ||
					"backgroundColor".compareTo(localName) == 0 || "orientation".compareTo(localName) == 0 ||
					"fullscreen".compareTo(localName) == 0 || "backgroundImage".compareTo(localName) == 0 ||
					/* iPhone settings not supported on Android */
					"barColor".compareTo(localName) == 0
					)
			{
				// Collect on end tag
			} else if ("window".compareTo(localName) == 0) {
				windowCounter++;
				currentWindow = new TitaniumWindowInfo(windowCounter);
			} else {
				Log.w(LCAT, "Unexpected element in windows: " + localName);
			}
		} else if (inModules) {
			if ("id".compareTo(localName) == 0 || "version".compareTo(localName) == 0) {

			} else if ("module".compareTo(localName) == 0) {
				currentModule = new TitaniumModuleInfo();
			} else {
				Log.w(LCAT, "Unexpected element in modules: " + localName);
			}
		} else {
			if ("id".compareTo(localName) == 0 || "name".compareTo(localName) == 0 ||
				"version".compareTo(localName) == 0 || "icon".compareTo(localName) == 0 ||
				/* Properties unsupported on Android */
				"persistent-wifi".compareTo(localName) == 0 ||
				"prerendered-icon".compareTo(localName) == 0 ||
				"statusbar-style".compareTo(localName) == 0
			)
			{
				// Collect on end tag
			} else if ("windows".compareTo(localName) == 0) {
				inWindows = true;
			} else if ("modules".compareTo(localName) == 0) {
				inModules = true;
			} else if ("property".compareTo(localName) == 0) {
				currentPropertyName = attributes.getValue("name");
				currentPropertyType = attributes.getValue("type");
				if (currentPropertyType == null) {
					currentPropertyType = TYPE_STRING;
				}
			} else if ("app".compareTo(localName) == 0) {
				// root element, do nothing.
			} else {
				Log.w(LCAT, "Unexpected element: " + localName);
			}
		}
	}

	@Override
	public void characters(char[] ch, int start, int length)
			throws SAXException
	{
		super.characters(ch, start, length);

		if (currentText == null) {
			currentText = new StringBuilder(256);
		}

		currentText.append(new String(ch, start, length));
	}

	@Override
	public void endElement(String uri, String localName, String name)
			throws SAXException
	{
		super.endElement(uri, localName, name);

		if (inWindows) {
			if ("id".compareTo(localName) == 0) {
				currentWindow.setWindowId(getTextAndClear());
			} else if ("backgroundColor".compareTo(localName) == 0) {
				currentWindow.setWindowBackgroundColor(getTextAndClear());
			} else if ("backgroundImage".compareTo(localName) == 0) {
				currentWindow.setWindowBackgroundImage(getTextAndClear());
			} else if ("fullscreen".compareTo(localName) == 0) {
				String value = getTextAndClear();
				currentWindow.setWindowFullscreen(Boolean.parseBoolean(value));
			} else if ("icon".compareTo(localName) == 0) {
				currentWindow.setWindowIconUrl(getTextAndClear());
			} else if ("orientation".compareTo(localName) == 0) {
				currentWindow.setWindowOrientation(getTextAndClear());
			} else if ("title".compareTo(localName) == 0) {
				currentWindow.setWindowTitle(getTextAndClear());
			} else if ("url".compareTo(localName) == 0) {
				currentWindow.setWindowUrl(getTextAndClear());
			} else if ("type".compareTo(localName) == 0) {
				currentWindow.setWindowType(getTextAndClear());
			} else if ("size".compareTo(localName) == 0) {
				currentWindow.setWindowSize(getTextAndClear());
			} else if ("window".compareTo(localName) == 0) {
				//TODO validate
				tai.addWindow(currentWindow);
				currentWindow = null;
			} else if ("windows".compareTo(localName) == 0) {
				inWindows = false;
			} else if ("barColor".compareTo(localName) == 0) {
				/* Unsupported elements on Android */
				clearText();
			} else {
				clearText();
			}
		} else if (inModules) {
			if ("id".compareTo(localName) == 0) {
				currentModule.setModuleId(getTextAndClear());
			} else if ("version".compareTo(localName) == 0) {
				currentModule.setModuleVersion(getTextAndClear());
			} else if ("module".compareTo(localName) == 0) {
				//TODO validate
				tai.addModule(currentModule);
				currentModule = null;
			} else if ("modules".compareTo("modules") == 0) {
				inModules = false;
			} else {
				clearText();
			}
		} else {
			if ("id".compareTo(localName) == 0) {
				tai.setAppId(getTextAndClear());
			} else if ("name".compareTo(localName) == 0) {
				tai.setAppName(getTextAndClear());
			} else if ("version".compareTo(localName) == 0) {
				tai.setAppVersion(getTextAndClear());
			} else if ("icon".compareTo(localName) == 0) {
				tai.setAppIconUrl(getTextAndClear());
			} else if ("guid".compareTo(localName) == 0) {
				tai.setAppGUID(getTextAndClear());
			} else if ("description".compareTo(localName) == 0) {
				tai.setAppDescription(getTextAndClear());
			} else if ("publisher".compareTo(localName) == 0) {
				tai.setAppPublisher(getTextAndClear());
			} else if ("copyright".compareTo(localName) == 0) {
				tai.setAppCopyright(getTextAndClear());
			} else if ("url".compareTo(localName) == 0) {
				tai.setAppIconUrl(getTextAndClear());
			} else if ("property".compareTo(localName) == 0) {
				if (currentPropertyName == null) {
					Log.e(LCAT, "property element missing name attribute value: " + currentText.toString());
					clearText();
				} else {
					String value = getTextAndClear();
					if (TYPE_BOOL.equals(currentPropertyType)) {
						prefs.setBool(currentPropertyName, Boolean.valueOf(value));
					} else if (TYPE_INT.equals(currentPropertyType)) {
						try {
							int i = Integer.valueOf(value);
							prefs.setInt(currentPropertyName, i);
						} catch (NumberFormatException e) {
							Log.e(LCAT, "Titanium system property " + currentPropertyName + " with type " +
									currentPropertyType + " could not be converted. Skipping.");
						}
					} else if (TYPE_DOUBLE.equals(currentPropertyType)) {
						try {
							double d = Double.valueOf(value);
							prefs.setDouble(currentPropertyName, d);
						} catch (NumberFormatException e) {
							Log.e(LCAT, "Titanium system property " + currentPropertyName + " with type " +
									currentPropertyType + " could not be converted. Skipping.");
						}
					} else {
						prefs.setString(currentPropertyName, value);
					}
					currentPropertyName = null;
					currentPropertyType = null;
				}
			} else if (
				"persistent-wifi".compareTo(localName) == 0 ||
				"prerendered-icon".compareTo(localName) == 0 ||
				"statusbar-style".compareTo(localName) == 0
				)
			{
				/* Elements not supported on Android */
				clearText();
			} else {
				clearText();
			}
		}
	}

	@Override
	public void endDocument() throws SAXException
	{
		super.endDocument();
	}

	private String getTextAndClear() {
		String s = currentText.toString().trim();
		clearText();
		return s;
	}

	private void clearText() {
		currentText = null; // throw away contents
	}
}
