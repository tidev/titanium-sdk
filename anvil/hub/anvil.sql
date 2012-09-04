CREATE DATABASE IF NOT EXISTS anvil_hub;

USE anvil_hub;

CREATE TABLE IF NOT EXISTS driver_state (
	id VARCHAR(20) NOT NULL,
	description VARCHAR(50) NOT NULL,
	state VARCHAR(20) NOT NULL,
	git_hash VARCHAR(50) NOT NULL,
	timestamp INT NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS runs (
	id INT NOT NULL AUTO_INCREMENT,
	git_hash VARCHAR(50) NOT NULL,
	branch VARCHAR(20) NOT NULL,
	timestamp INT NOT NULL,
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
