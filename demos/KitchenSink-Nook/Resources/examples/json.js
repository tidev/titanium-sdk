var win = Titanium.UI.currentWindow;

var data = [];
function testRow(name, str, testfn) {
	var passed = testfn(JSON.parse(str));
	data.push({title: name + " : " + passed, color: passed ? "green" : "red", height: 80, font:{fontSize:24}, left:20});
}

testRow("nested object", "{\"a\": {\"b\": 1}}", function(obj) { return obj.a.b == 1; });
testRow("array", "[1, 2, 3]", function(obj) { return obj[0] == 1 && obj[1] == 2 && obj[2] == 3; });
testRow("integer", "123", function(obj) { return obj==123; });
testRow("double", "123.456", function(obj) { return obj == 123.456; });

var testTable = Titanium.UI.createTableView({
	top:0, left:0, bottom:0, right:0,
	data: data
});
win.add(testTable);
