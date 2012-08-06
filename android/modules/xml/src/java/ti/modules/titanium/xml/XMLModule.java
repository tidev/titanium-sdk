/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;
import org.xml.sax.SAXException;

@Kroll.module
public class XMLModule extends KrollModule {

	private static DocumentBuilder builder;
	private static final String TAG = "XMLModule";
	private static TransformerFactory transformerFactory;
	
	static {
		try {
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			factory.setNamespaceAware(true);
			builder = factory.newDocumentBuilder();
		} catch (ParserConfigurationException e) {
			Log.e(TAG, "Error finding DOM implementation", e);
		}

		transformerFactory = TransformerFactory.newInstance();
	}

	public XMLModule()
	{
		super();
	}

	public XMLModule(TiContext context)
	{
		this();
	}
	
	@Kroll.method
	public DocumentProxy parseString(String xml)
		throws SAXException, IOException
	{
		return parse(xml);
	}
	
	public static DocumentProxy parse(String xml)
		throws SAXException, IOException
	{
		return parse(xml, System.getProperty("file.encoding", "UTF-8"));
	}

	public static DocumentProxy parse(TiContext tiContext, String xml)
		throws SAXException, IOException
	{
		return XMLModule.parse(xml);
	}

	public static DocumentProxy parse(String xml, String encoding)
		throws SAXException, IOException
	{
		if (builder != null) {
			try {
				return new DocumentProxy(builder.parse(new ByteArrayInputStream(xml.getBytes(encoding))));
			} catch (SAXException e) {
				Log.e(TAG, "Error parsing XML", e);
				throw e;
			} catch (IOException e) {
				Log.e(TAG, "Error reading XML", e);
				throw e;
			}
		}
		return null;
	}

	public static DocumentProxy parse(TiContext tiContext, String xml, String encoding)
		throws SAXException, IOException
	{
		return XMLModule.parse(xml, encoding);
	}

	@Kroll.method
	public String serializeToString(NodeProxy node) throws TransformerConfigurationException, TransformerException
	{
		Transformer transformer = transformerFactory.newTransformer();
		StringWriter writer = new StringWriter();
		transformer.transform(new DOMSource(node.getNode()), new StreamResult(writer));
		return writer.toString();
	}

}
