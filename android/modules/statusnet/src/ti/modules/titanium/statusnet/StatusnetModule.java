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

import ti.modules.titanium.xml.NodeProxy;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class StatusnetModule extends TiModule {

    public StatusnetModule(TiContext context) {
        super(context);
    }

    /**
     * Iterate over all direct children of the given DOM node, calling functions from a map
     * based on the element's node name. This is used because doing a bunch of individual selector
     * lookups for every element we need is hella slow on mobile; iterating directly over the
     * element set has a lot less overhead.
     *
     * @param DOMNode parent
     * @param object map dictionary of node names to functions, which will have the child element passed to them.
     * @access private
     */
    public void mapOverElements(Object parent, TiDict map) {
        System.out.println("PPP - ELEMENT IS: " + parent.getClass().getName());
        NodeList list = ((NodeProxy)parent).getNode().getChildNodes();
        int last = list.getLength();
        for (int i = 0; i < last; i++) {
            Node el = list.item(i);
            if (el.getNodeType() == Node.ELEMENT_NODE) {
                Object target = map.get(el.getNodeName());
                if (target != null) {
                    System.out.println("PPP - callback for " + el.getNodeName());
                    KrollCallback callback = (KrollCallback)target;
                    NodeProxy proxy = NodeProxy.getNodeProxy(getTiContext(), el);
                    System.out.println("PPP - calling with proxy: " + proxy);
                    callback.call(new Object[]{proxy});
                    System.out.println("PPP - called.");
                } else {
                    System.out.println("PPP - no callback for " + el.getNodeName());
                }
            } else {
                System.out.println("PPP - skipped non-element.");
            }
        }
        System.out.println("PPP - done.");
    }

    /**
     * Transitioning between Java and JS code appears to be insanely
     * inefficient, so we're going to try to minimize it here...
     * We can't call the callbacks directly, since they'd get called
     * asynchronously. Instead, we build a list of output items!
     *
     * Return value should look something like:
     * [{node: el1, target: callback1},
     *  {node: el2, target: callback2}
     *  {node: el3, target: callback1}]
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
                Object target = map.get(el.getNodeName());
                if (target != null) {
                    TiDict dict = new TiDict();
                    NodeProxy proxy = NodeProxy.getNodeProxy(getTiContext(), el);
                    dict.put("node", proxy);
                    dict.put("target", target); // for some reason these end up non-callable
                    dict.put("name", el.getNodeName());
                    matches.add(dict);
                }
            }
        }
        return matches.toArray();
    }
}