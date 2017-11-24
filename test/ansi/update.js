'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Query Operators', function() {
	describe('$update: { ... }', function() {

		describe('$set: { ... }', function() {
			it('should return UPDATE `table-identifier` SET col1 = value1, ...', function() {
				var query = sqlbuilder.build({
					$update: {
						$table: 'people',
						$set: {
							first_name: 'John',
							last_name: 'Doe'
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('UPDATE `people` SET `first_name` = ?, `last_name` = ?');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
			});

			it('should return UPDATE `table-identifier` SET col1 = value1, ... WHERE ...', function() {
				var query = sqlbuilder.build({
					$update: {
						$table: 'people',
						$set: {
							first_name: 'John',
							last_name: 'Doe'
						},
						$where: {
							age: { $gte: 18 }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('UPDATE `people` SET `first_name` = ?, `last_name` = ? WHERE `age` >= ?');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(18);
			});
		});


	});
});
