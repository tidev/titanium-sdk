describe("testing drillbit (meta!)", {
	passing_test: function() {
		value_of(true).should_be_true();
	},
	
	passing_async_test_as_async: function(callback) {
		setTimeout(function() {
			value_of(true).should_be_true();
			callback.passed();
		}, 500);
	},
	
	failing_async_test_as_async: function(callback) {
		setTimeout(function() {
			try {
				value_of(true).should_be_false();
			} catch(e) {
				callback.failed(e);
			}
		}, 500);
	}
});