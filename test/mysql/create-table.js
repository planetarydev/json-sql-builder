'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('mysql');

describe('MySQL specific CREATE TABLE', function() {
	describe('$create: { ... }', function() {

		describe('$temp: true', function() {
			it('should return CREATE TEMP TABLE `table-identifier` Statement with all other helpers.', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$temp: true,
						$define: {
							_id: { $column: { $type: 'INT', $autoInc: true, $primary: true } }
						},
						$engine: 'InnoDb',
						$autoInc: 100,
						$collate: 'utf8',
						$tablespace: 'testspace'
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TEMPORARY TABLE `users` (`_id` INT AUTO_INCREMENT PRIMARY KEY) AUTO_INCREMENT=100 ENGINE=InnoDb COLLATE=`utf8` TABLESPACE=`testspace`');
				expect(query.values.length).to.equal(0);
			});
		});

	});
});
