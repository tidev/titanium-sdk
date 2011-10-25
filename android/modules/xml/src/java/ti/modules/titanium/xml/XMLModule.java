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

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;
import org.xmlpull.v1.XmlSerializer;

import android.util.Xml;

@Kroll.module
public class XMLModule extends KrollModule {

	private static DocumentBuilder builder;
	private static final String LCAT = "XMLModule";
	
	static {
		try {
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			factory.setNamespaceAware(true);
			builder = factory.newDocumentBuilder();
		} catch (ParserConfigurationException e) {
			Log.e(LCAT, "Error finding DOM implementation", e);
		}
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
				Log.e(LCAT, "Error parsing XML", e);
				throw e;
			} catch (IOException e) {
				Log.e(LCAT, "Error reading XML", e);
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
	public String serializeToString(NodeProxy node)
	{
		StringWriter writer = new StringWriter();
		XmlSerializer out = Xml.newSerializer();
		try {
			out.setOutput(writer);
			serializeNode(out, node.getNode());
			out.endDocument();
			return writer.toString();
		} catch (Exception e) {
			Log.e(LCAT, "Error serializing XML", e);
			return null;
		}
	}
	
	private void serializeNode(XmlSerializer out, Node node) throws IOException
	{
		switch (node.getNodeType()) {
			case Node.ATTRIBUTE_NODE:
				out.attribute(namespaceFor(node), nameFor(node), node.getNodeValue());
				break;
			case Node.CDATA_SECTION_NODE:
				out.cdsect(node.getNodeValue());
				break;
			case Node.COMMENT_NODE:
				out.comment(node.getNodeValue());
				break;
			case Node.DOCUMENT_NODE:
				serializeNode(out, ((Document)node).getDocumentElement());
				break;
			case Node.ELEMENT_NODE:
				String ns = namespaceFor(node);
				String name = nameFor(node);
				out.startTag(ns, name);

				NamedNodeMap attribs = node.getAttributes();
				if (attribs != null) {
					int length = attribs.getLength();
					for (int i = 0; i < length; i++) {
						serializeNode(out, attribs.item(i));
					}
				}

				NodeList children = node.getChildNodes();
				int length = children.getLength();
				for (int i = 0; i < length; i++) {
					serializeNode(out, children.item(i));
				}

				out.endTag(ns, name);
				break;
			case Node.ENTITY_REFERENCE_NODE:
				out.entityRef(node.getNodeName());
				break;
			case Node.PROCESSING_INSTRUCTION_NODE:
				out.processingInstruction(node.getNodeValue());
				break;
			case Node.TEXT_NODE:
				out.text(node.getNodeValue());
				break;
			default:
				Log.e(LCAT, "Skipping unrecognized node of type " + node.getNodeType());
				break;
		}
	}

	private String namespaceFor(Node node)
	{
		String ns = node.getNamespaceURI();
		if (ns == null) {
			return "";
		} else {
			return ns;
		}
	}
	
	private String nameFor(Node node)
	{
		if (node.getNamespaceURI() == null) {
			return node.getNodeName();
		} else {
			return node.getLocalName();
		}
	}

}
