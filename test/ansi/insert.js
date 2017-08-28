'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Query Operators', function() {
	describe('$insert: { ... }', function() {

		describe('$into with $columns and $values', function() {
			it('should return INSERT INTO `table-identifier` (`col1`, `col2`, ... `col_n`) VALUES (?, ?, ... ?)', function() {
				var query = sqlbuilder.build({
					$insert: {
						$into: 'people',
						$columns: ['first_name', 'last_name', 'age'],
						$values: ['John', 'Doe', 45]
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) VALUES (?, ?, ?)');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(45);
			});
		});

		describe('$documents: [{}, {}, ...] | {...}', function() {
			it('should return INSERT INTO `table-identifier` (`col1`, `col2`, ... `col_n`) VALUES (?, ?, ... ?)', function() {
				var query = sqlbuilder.build({
					$insert: {
						$into: 'people',
						$documents: {
							first_name: 'John',
							last_name: 'Doe',
							age: 45
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) VALUES (?, ?, ?)');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(45);
			});

			it('should return INSERT INTO `table-identifier` (`col1`, `col2`, ... `col_n`) VALUES (?, ?, ... ?), (?, ?, ...?)', function() {
				var query = sqlbuilder.build({
					$insert: {
						$into: 'people',
						$documents: [
							{ first_name: 'John', last_name: 'Doe', age: 45	},
							{ first_name: 'Mike', last_name: 'Oldfield', age: 67 },
							{ first_name: 'Jane', last_name: 'Dan',	age: 32	}
						]
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)');
				expect(query.values.length).to.equal(9);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(45);
				expect(query.values[3]).to.equal('Mike');
				expect(query.values[4]).to.equal('Oldfield');
				expect(query.values[5]).to.equal(67);
				expect(query.values[6]).to.equal('Jane');
				expect(query.values[7]).to.equal('Dan');
				expect(query.values[8]).to.equal(32);
			});
		});

		describe('$select: {}', function() {
			it('should return INSERT INTO `table-identifier` (`col1`, `col2`, ... `col_n`) SELECT ...', function() {
				var query = sqlbuilder.build({
					$insert: {
						$into: 'people',
						$columns: ['first_name', 'last_name', 'age'],
						$select: {
							$columns: ['first_name', 'last_name', 'age'],
							$from: 'other_people',
							$where: {
								age: { $gte: 18 }
							}
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('INSERT INTO `people` (`first_name`, `last_name`, `age`) SELECT `first_name`, `last_name`, `age` FROM `other_people` WHERE `age` >= ?');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal(18);
			});
		});
	});
});
