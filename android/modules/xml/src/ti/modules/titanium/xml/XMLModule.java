/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.StringWriter;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;
import org.xml.sax.SAXException;

public class XMLModule extends TiModule {

	private static DocumentBuilder builder;
	private static Transformer transformer;
	private static final String LCAT = "XMLModule";
	
	static {
		try {
			builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
		} catch (ParserConfigurationException e) {
			Log.e(LCAT, "Error finding DOM implementation", e);
		}
		try {
			transformer = TransformerFactory.newInstance().newTransformer();
			transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
		} catch (javax.xml.transform.TransformerConfigurationException e) {
			Log.e(LCAT, "Error finding DOM transformer implementation", e);
		}
	}
	
	public XMLModule(TiContext context) {
		super(context);
	}
	
	public DocumentProxy parseString(String xml)
	{
		return parse(getTiContext(), xml);
	}
	
	public static DocumentProxy parse(TiContext context, String xml)
	{
		if (builder != null) {
			try {
				return new DocumentProxy(context, builder.parse(new ByteArrayInputStream(xml.getBytes())));
			} catch (SAXException e) {
				Log.e(LCAT, "Error parsing XML", e);
			} catch (IOException e) {
				Log.e(LCAT, "Error reading XML", e);
			}
		}
		return null;
	}
	
	public String serializeToString(NodeProxy node)
	{
		if (transformer != null) {
			try {
				StringWriter writer = new StringWriter();
				transformer.transform(new DOMSource(node.getNode()), new StreamResult(writer));
				return writer.toString();
			} catch (TransformerException e) {
				Log.e(LCAT, "Error serializing XML", e);
			}
		}
		return null;
	}
}
