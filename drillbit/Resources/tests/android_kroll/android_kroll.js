describe("Android Kroll Tests",
{
	ti_sanity: function() {
		value_of(Ti).should_not_be_null();
		value_of(Titanium).should_not_be_null();
		value_of(Ti).should_be(Titanium);
	}
});
