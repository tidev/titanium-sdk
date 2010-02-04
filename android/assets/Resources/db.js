//try {
	var db = Ti.Database.open("test");

	db.execute("create table if not exists Test(row text)");
	db.execute("insert into Test(row) values(?)", 'fred');

	var rs = db.execute("select * from Test");

	Ti.API.info("Row Count: " + rs.getRowCount());

	while (rs.isValidRow())
	{
		Ti.API.info('ID: ' + rs.field(0) + ' NAME: ' + rs.fieldByName('row'));
		rs.next();
	}

	rs.close();
	db.close();
//	db.remove();
//} catch(E) {
//	Ti.API.error(E);
//}