define(["Ti/_/Evented", "Ti/_/lang"],
	function(Evented, lang) {

	return lang.setObject("Ti.Yahoo", Evented, {

		yql: function(query, callback) {
			require([
				"http://query.yahooapis.com/v1/public/yql?format=json&callback=define&q="
					+ encodeURIComponent(query)
					.replace(/!/g,'%21')
					.replace(/'/g,'%27')
					.replace(/\(/,'%28')
					.replace(/\)/,'%29')
			], function(data) {
				var data = data || {},
					results = data.query && data.query.results;
				require.is(callback, "Function") && callback({
					success: !!results,
					data: results,
					message: data.error && data.error.description
				});
			});
		}

	});

});
