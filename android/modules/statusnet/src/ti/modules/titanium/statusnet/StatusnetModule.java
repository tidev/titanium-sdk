/**
 * StatusNet Mobile
 * http://status.net/wiki/Client
 *
 * Optimized Java implementation of our XML mapping loop for Android.
 * Module hack per http://developer.appcelerator.com/doc/mobile/android-custom-modules
 *
 * Copyright 2010 StatusNet, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ti.modules.titanium.statusnet;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.kroll.KrollCallback;

import ti.modules.titanium.xml.ElementProxy;
import ti.modules.titanium.xml.NodeProxy;

import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class StatusnetModule extends TiModule {

    public StatusnetModule(TiContext context) {
        super(context);
    }

    /**
     * Helper for StatusNet.AtomParser.mapOverElements()
     *
     * Transitioning between Java and JS code appears to be insanely
     * inefficient, so we're going to try to minimize it here...
     * We can't call the callbacks directly, since they'd get called
     * asynchronously. Instead, we build a list of output items!
     *
     * Return value should look something like:
     * [{node: el1, name: "link", text: ""},
     *  {node: el2, name: "author", text: "Foo Bar"},
     *  {node: el3, name: "link", text: ""}]
     *
     * Caller can then iterate over that list and make direct calls
     * within the JS context.
     */
    public Object[] mapOverElementsHelper(Object parent, TiDict map) {
        ArrayList<TiDict> matches = new ArrayList<TiDict>();

        NodeList list = ((NodeProxy)parent).getNode().getChildNodes();
        int last = list.getLength();
        for (int i = 0; i < last; i++) {
            Node el = list.item(i);
            if (el.getNodeType() == Node.ELEMENT_NODE) {
                String name = el.getNodeName();
                Object target = map.get(name);
                if (target != null) {
                    TiDict dict = new TiDict();

                    ElementProxy proxy = (ElementProxy)NodeProxy.getNodeProxy(getTiContext(), el);

                    TiDict attribsDict = new TiDict();
                    NamedNodeMap attributes = el.getAttributes();
                    int numAttribs = attributes.getLength();
                    for (int j = 0; j < numAttribs; j++) {
                        Node attrib = attributes.item(j);
                        attribsDict.put(attrib.getNodeName(), attrib.getNodeValue());
                    }

                    dict.put("name", name);
                    dict.put("node", proxy);
                    dict.put("text", proxy.getText());
                    dict.put("attributes", attribsDict);

                    matches.add(dict);
                }
            }
        }
        return matches.toArray();
    }
}