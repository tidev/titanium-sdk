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

public interface IRequestDelegate {
    /**
     * Called just before the request is sent to the server.
     */
    public void requestLoading(FBRequest request);

    /**
     * Called when an error prevents the request from completing successfully.
     */
    public void requestDidFailWithError(FBRequest request, Throwable error);

    /**
     * Called when a request returns and its response has been parsed.
     * 
     * The resulting object will be a JSONArray or JSONObject,
     * depending on the response type.
     */
    public void requestDidLoad(FBRequest request, String contentType, Object result);

    /**
     * Called when the request was cancelled.
     */
    public void requestWasCancelled(FBRequest request);
}
