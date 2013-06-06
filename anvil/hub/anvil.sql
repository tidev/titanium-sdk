CREATE DATABASE IF NOT EXISTS anvil_hub;

USE anvil_hub;

CREATE TABLE IF NOT EXISTS driver_state (
	id VARCHAR(20) NOT NULL,
	description VARCHAR(50) NOT NULL,
	state VARCHAR(20) NOT NULL,
	git_hash VARCHAR(50) NOT NULL,
	timestamp INT NOT NULL,
	environment VARCHAR(255) NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS runs (
	id INT NOT NULL AUTO_INCREMENT,
	git_hash VARCHAR(50) NOT NULL,
	branch VARCHAR(20) NOT NULL,
	timestamp INT NOT NULL,
	base_sdk_filename VARCHAR(30) NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS driver_runs (
	id INT NOT NULL AUTO_INCREMENT,
	run_id INT NOT NULL,
	driver_id VARCHAR(20) NOT NULL,
	passed_tests INT NOT NULL,
	failed_tests INT NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS config_sets (
	id INT NOT NULL AUTO_INCREMENT,

	/* needed for "cheaper" branch based reporting */
	branch VARCHAR(20) NOT NULL,

	driver_run_id INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS configs (
	id INT NOT NULL AUTO_INCREMENT,

	/* needed for "cheaper" branch based reporting */
	branch VARCHAR(20) NOT NULL,
	config_set_name VARCHAR(50) NOT NULL,

	config_set_id INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS suites (
	id INT NOT NULL AUTO_INCREMENT,

	/* needed for "cheaper" branch based reporting */
	branch VARCHAR(20) NOT NULL,
	config_name VARCHAR(50) NOT NULL,

	config_id INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS results (
	id INT NOT NULL AUTO_INCREMENT,

	/* needed for "cheaper" branch based reporting */
	branch VARCHAR(20) NOT NULL,
	run_id INT NOT NULL,
	driver_id VARCHAR(20) NOT NULL,
	suite_name VARCHAR(50) NOT NULL,

	suite_id INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	duration INT NOT NULL,
	result VARCHAR(10) NOT NULL,
	description VARCHAR(255) NOT NULL,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS known_failures (
	id INT NOT NULL AUTO_INCREMENT,

	suite_name VARCHAR(50) NOT NULL,
	name VARCHAR(50) NOT NULL,
	platform VARCHAR(10) NOT NULL,
	PRIMARY KEY(id)
);

LOCK TABLES `known_failures` WRITE;
/*!40000 ALTER TABLE `known_failures` DISABLE KEYS */;
INSERT INTO known_failures VALUES 
(1,"app","test_custom_values","ios"),
(2,"commonjs/commonjs","test_absolute","ios"),
(3,"commonjs/commonjs","test_monkeys","ios"),
(4,"commonjs/commonjs","test_method","ios"),
(5,"commonjs/commonjs","test_exactExports","ios"),
(6,"commonjs/commonjs","test_transitive","ios"),
(7,"commonjs/commonjs","test_cyclic","ios"),
(8,"commonjs/commonjs","test_nested","ios"),
(9,"commonjs/commonjs","test_missing","ios"),
(10,"commonjs/commonjs","test_hasOwnProperty","ios"),
(11,"commonjs/commonjs","test_determinism","ios"),
(12,"commonjs/commonjs","test_relative","ios"),
(13,"filesystem/filesystem","fileMove","ios"),
(14,"filesystem/filesystem","dotSlash","ios"),
(15,"includes/includes","relativeDown","ios"),
(16,"includes/includes","multipleRequire","ios"),
(17,"includes/includes","lotsOfDots","ios"),
(18,"includes/includes","slashToRoot","ios"),
(19,"includes/includes","simpleRequire","ios"),
(20,"includes/includes","dotdotSlash","ios"),
(21,"kroll","customObjects","ios"),
(22,"media/media","audioTimeValidation","ios"),
(23,"network_httpclient","clearCookiePositiveTest","ios"),
(24,"network_socket_tcp","testSocketIO","ios"),
(25,"stream","pump","ios"),
(26,"ui/ui","webviewFireEvent","ios"),
(27,"ui/ui","webviewEvalJSLockup","ios"),
(28,"ui/ui","absoluteAndRelativeWinURLs","ios"),
(29,"ui/ui","webviewBindingAvailable","ios"),
(30,"ui_controls","textControlsTextValueInitialValue","ios"),
(31,"ui_layout","scrollViewWithSIZE","ios"),
(32,"yahoo","yqlFlickrCats","ios"),
(33,"android/android/android","jsActivityUrl","android"),
(34,"commonjs/commonjs","test_determinism","android"),
(35,"commonjs/commonjs","test_relative","android"),
(36,"commonjs/commonjs","test_absolute","android"),
(37,"includes/includes","dotSlash","android"),
(38,"includes/includes","slashToRoot","android"),
(39,"includes/includes","lotsOfDots","android"),
(40,"includes/includes","dotdotSlash","android"),
(41,"includes/includes","relativeDown","android"),
(42,"jss","platform_jss_dirs","android"),
(43,"network_httpclient","callbackTestForPOSTMethod","android"),
(44,"xml/xml","apiXmlDocumentCreateProcessingInstruction","android"),
(45,"xml/xml","apiXmlAttr","android"),
(46,"xml/xml","apiXmlDocumentCreateElementNS","android"),
(47,"xml/xml","apiXmlNodeRemoveChild","android"),
(48,"xml/xml","apiXmlDocumentCreateDocumentFragment","android"),
(49,"xml/xml","apiXmlNodeAppendChild","android"),
(50,"xml/xml","apiXmlDocumentCreateCDATASection","android"),
(51,"xml/xml","xmlElement","android"),
(52,"xml/xml","apiXmlDocumentCreateTextNode","android"),
(53,"xml/xml","xmlNamedNodeMap","android"),
(54,"xml/xml","apiXmlDocumentCreateEntityReference","android"),
(55,"xml/xml","apiXmlNodeReplaceChild","android"),
(56,"xml/xml","apiXmlDocumentCreateElement","android"),
(57,"xml/xml","apiXmlNodeInsertBefore","android"),
(58,"xml/xml","apiXmlDocumentCreateComment","android"),
(59,"xml/xml","xmlElementNS","android"),
(60,"xml/xml","apiXmlDocumentImportNode","android"),
(61,"xml/xml","apiXmlDocumentCreateAttribute","android"),
(62,"xml/xml","apiXmlDOMImplementation","android"),
(63,"yahoo","yqlFlickrCats","android");
/*!40000 ALTER TABLE `known_failures` ENABLE KEYS */;
UNLOCK TABLES;