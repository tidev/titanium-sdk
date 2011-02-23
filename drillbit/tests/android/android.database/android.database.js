describe("Android Ti.Database tests", {
	dataKeepsPrecision: function() {
		var longData = 109951162777512099;
		var doubleData = 1.2345678901234567;
		var db = Ti.Database.install("test.db", "test_dataKeepsPrecision");

		var rs = db.execute("select * from data");
		valueOf(rs.isValidRow()).shouldBeTrue();

		valueOf(rs.getFieldByName("longdata")).shouldBe(longData);
		valueOf(rs.getFieldByName("doubledata")).shouldBe(doubleData);
	}
});