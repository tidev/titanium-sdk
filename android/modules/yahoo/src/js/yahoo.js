var sha1 = kroll.binding("sha1");

module.exports = {
	percentEscape: function(r) {
		return encodeURIComponent(r).replace(/!/g,'%21').replace(/'/g,'%27').replace(/\(/,'%28').replace(/\)/,'%29');
	},

	oauthRequest: function(key, secret, apiEndpoint, apiQuery) {
		var encodedQuery = this.percentEscape(apiQuery);
		var timestamp = Math.floor(new Date().getTime()/1000);
		var theUrl = apiEndpoint.split('?')[0];

		var nonce = '';
		for (var i = 0; i < 10; i++) {
			nonce += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
		}

		var theHead = apiEndpoint.split('?')[1];
		var theBody = '&oauth_consumer_key=' + key;
		theBody += '&oauth_nonce=' + nonce;
		theBody += '&oauth_signature_method=HMAC-SHA1';
		theBody += '&oauth_timestamp=' + timestamp;
		theBody += '&oauth_version=1.0';
		theBody += '&q=' + encodedQuery;
	
		var theData = 'GET' + '&' + this.percentEscape(theUrl) + '&'
			+ this.percentEscape(theHead) + this.percentEscape(theBody);

		var theSig = sha1.b64_hmac_sha1(secret + '&', theData);
		return apiEndpoint + theBody + '&oauth_signature=' + this.percentEscape(theSig);
	},

	setOAuthParameters: function(consumerKey, sharedSecret) {
		this._consumerKey = consumerKey;
		this._sharedSecret = sharedSecret;
	},

	yql: function(apiQuery, callback) {
		var apiEndpoint = 'http://query.yahooapis.com/v1/public/yql?format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env';
		var url = apiEndpoint + "&q=" + this.percentEscape(apiQuery);
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onerror = function(e) {
			callback(e);
			var msg = this.responseText;
			if (msg === null) {
				msg = this.statusText;
			}
			Titanium.API.error("Error during query (" + apiQuery + "): " + msg);
		};

		var self = this;
		xhr.onload = function() {
			Titanium.API.info("YQL: " + this.reponseText);
			callback({ source: self, data: eval('('+this.responseText+')').query.results });
		}

		xhr.onreadystatechange = function() {
			Titanium.API.info("RS:" + this.readyState);
		}

		xhr.open('GET', url);
		xhr.send();
	},

	yqlO: function(apiQuery,callback) {
		var apiEndpoint = 'http://query.yahooapis.com/v1/yql?format=json';
		var url = this.oauthRequest(this._consumerKey, this._sharedSecret, apiEndpoint, apiQuery);
		var xhr = Titanium.Network.createHTTPClient();

		xhr.onerror = function(e) {
			callback(e);
			var msg = this.responseText;
			if (msg === null) {
				msg = this.statusText;
			}
			Titanium.API.error("Error during query (" + apiQuery + "): " + msg);
		}

		var self = this;
		xhr.onload = function() {
			callback({ source: self, data: eval('('+this.responseText+')').query.results });
		}
		xhr.open('GET', url);
		xhr.send();
	}
};