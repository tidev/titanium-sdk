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
    public void mapOverElements(NodeProxy parent, TiDict map) {
        NodeList list = parent.getNode().getChildNodes();
        int last = list.getLength();
        for (int i = 0; i < last; i++) {
            Node el = list.item(i);
            if (el.getNodeType() == Node.ELEMENT_NODE) {
                Object target = map.get(el.getNodeName());
                if (target != null) {
                    KrollCallback callback = (KrollCallback)target;
                    callback.call(new Object[]{el});
                }
            }
        }
    }

}