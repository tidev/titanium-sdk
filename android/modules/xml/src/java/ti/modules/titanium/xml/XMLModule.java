/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.w3c.dom.Document;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

@Kroll.module
public class XMLModule extends KrollModule
{

	private static DocumentBuilder builder;
	private static SAXParser strictSaxParser;
	private static final String TAG = "XMLModule";
	private static TransformerFactory transformerFactory;

	static
	{
		try {
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			factory.setNamespaceAware(true);
			builder = factory.newDocumentBuilder();
			// Install a strict error handler so malformed XML (unclosed tags,
			// multiple top-level elements, etc.) throws instead of being
			// silently auto-corrected by the Expat-backed DOM adapter.
			builder.setErrorHandler(new ErrorHandler() {
				@Override
				public void warning(SAXParseException e) throws SAXException
				{
					throw e;
				}

				@Override
				public void error(SAXParseException e) throws SAXException
				{
					throw e;
				}

				@Override
				public void fatalError(SAXParseException e) throws SAXException
				{
					throw e;
				}
			});
		} catch (ParserConfigurationException e) {
			Log.e(TAG, "Error finding DOM implementation", e);
		}

		// A strict SAX parser is used as a pre-pass to catch malformed XML that
		// the Expat DOM adapter silently recovers from (e.g. unclosed tags at
		// EOF). The DOM builder's ErrorHandler alone is insufficient because
		// Expat's DOM path synthesizes close tags without emitting errors.
		try {
			SAXParserFactory saxFactory = SAXParserFactory.newInstance();
			saxFactory.setNamespaceAware(true);
			strictSaxParser = saxFactory.newSAXParser();
		} catch (ParserConfigurationException | SAXException e) {
			Log.e(TAG, "Error creating strict SAX parser", e);
		}

		transformerFactory = TransformerFactory.newInstance();
	}

	public XMLModule()
	{
		super();
	}

	@Kroll.method
	public DocumentProxy parseString(String xml) throws SAXException, IOException
	{
		return parse(xml);
	}

	public static DocumentProxy parse(String xml) throws SAXException, IOException
	{
		return parse(xml, System.getProperty("file.encoding", "UTF-8"));
	}

	public static DocumentProxy parse(String xml, String encoding) throws SAXException, IOException
	{
		if (builder != null) {
			byte[] bytes = xml.getBytes(encoding);
			// Strict SAX pre-pass: Expat's DOM adapter silently auto-corrects
			// some malformations (unclosed tags at EOF, multiple roots). The
			// SAX path is stricter and will throw for those cases.
			if (strictSaxParser != null) {
				try {
					strictSaxParser.parse(new ByteArrayInputStream(bytes), new org.xml.sax.helpers.DefaultHandler());
				} catch (SAXException e) {
					Log.e(TAG, "Error parsing XML", e);
					throw e;
				}
			}
			try {
				// Route through NodeProxy.getNodeProxy() so the returned
				// DocumentProxy is registered in the proxy cache. This makes
				// node.ownerDocument === doc hold in JS (same proxy instance),
				// which lets should.js's eql() short-circuit on reference
				// equality instead of deep-comparing the cyclic proxy graph.
				Document doc = builder.parse(new ByteArrayInputStream(bytes));
				return (DocumentProxy) NodeProxy.getNodeProxy(doc);
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

	@Kroll.method
	public String serializeToString(NodeProxy node) throws TransformerConfigurationException, TransformerException
	{
		Transformer transformer = transformerFactory.newTransformer();
		StringWriter writer = new StringWriter();
		transformer.transform(new DOMSource(node.getNode()), new StreamResult(writer));
		return writer.toString();
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML";
	}
}
