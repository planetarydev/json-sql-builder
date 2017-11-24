'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('mysql');

describe('MySQL Query Operators', function() {
	describe('$insert: { ... }', function() {

		describe('$into with $columns and $values', function() {
			// check for inheriten $into helper
			it('should return Standard INSERT INTO `table-identifier` (`col1`, `col2`, ... `col_n`) VALUES (?, ?, ... ?)', function() {
				var query = sqlbuilder.build({
					$insert: {
						$table: 'people',
						$columns: ['first_name', 'last_name', 'age'],
						$values: ['John', 'Doe', 45]
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) VALUES (?, ?, ?)');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(45);
			});
		});

		describe('$onDuplicateKeyUpdate: { ... }', function() {
			it('should return INSERT INTO `table-identifier` ( ... ) VALUES ( ... ) ON DUPLICATE KEY UPDATE ...', function() {
				var query = sqlbuilder.build({
					$insert: {
						$table: 'people',
						$columns: ['first_name', 'last_name', 'age'],
						$values: ['John', 'Doe', 45],
						$onDuplicateKeyUpdate: {
							first_name: 'Duplicated John',
							last_name: { $values: '~~last_name' },
							age: { $inc: 1 }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `first_name` = ?, `last_name` = VALUES(`last_name`), `age` = `age` + ?');
				expect(query.values.length).to.equal(5);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(45);
				expect(query.values[3]).to.equal('Duplicated John');
				expect(query.values[4]).to.equal(1);
			});
		});

	});
});
