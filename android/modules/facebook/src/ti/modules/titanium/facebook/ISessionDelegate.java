/*
 * Copyright 2009 Codecarpet
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ti.modules.titanium.facebook;

public interface ISessionDelegate {
    /**
     * Called when a user has successfully logged in and begun a session.
     */
    public void sessionDidLogin(FBSession session, Long uid);

    /**
     * Called when a session is about to log out.
     */
    public void sessionWillLogout(FBSession session, Long uid);

    /**
     * Called when a session has logged out.
     */
    public void sessionDidLogout(FBSession session);
}
