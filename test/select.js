"use strict";

const expect     = require("chai").expect;
const SQLBuilder = require('../index');
const SQLQuery   = require('../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('mysql');

describe("Check Helpers", function() {
    it("$select", function() {
        expect('$select' in sqlbuilder._helpers).to.equal(true);
    });
});


describe("SELECT Statements", function() {
    describe("Simple", function() {

        it("Only Table", function() {
            var query = sqlbuilder.build({
                $select: {
                    $table: 'people'
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT * FROM `people`');
			expect(query.values.length).to.equal(0);
        });

		it("Table with alias", function() {
			var query = sqlbuilder.build({
				$select: {
					$table: { people: { $as: 'alias_people' } }
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` AS `alias_people`');
			expect(query.values.length).to.equal(0);
		});


        it("Table with columns as array of strings", function() {
            var query = sqlbuilder.build({
                $select: {
                    $columns: ['first_name', 'last_name'],
                    $table: 'people'
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people`');
            expect(query.values.length).to.equal(0);
        });

        it("Table with columns as object", function() {
            var query = sqlbuilder.build({
                $select: {
                    $columns: [
                        { first_name: { $val: 'John' } },
                        { last_name: { $as: 'alias_last_name' } },
                        { gender: { $val: 'male' } }
                    ],
                    $table: 'people'
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT ? AS `first_name`, `last_name` AS `alias_last_name`, ? AS `gender` FROM `people`');
            expect(query.values.length).to.equal(3);
            expect(query.values[0]).to.equal('John');
            expect(query.values[1]).to.equal('Doe');
            expect(query.values[2]).to.equal('male');
        });

        it("Table with simple WHERE clause", function() {
            var query = sqlbuilder.build({
                $select: {
                    $table: 'people',
                    $where: {
                        first_name: 'John',
                        last_name: 'Doe'
                    }
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
            expect(query.values.length).to.equal(2);
            expect(query.values[0]).to.equal('John');
            expect(query.values[1]).to.equal('Doe');
        });

        it("Table with simple WHERE clause, $eq", function() {
            var query = sqlbuilder.build({
                $select: {
                    $table: 'people',
                    $where: {
                        first_name: 'John',
                        last_name: { $eq: 'Doe' }
                    }
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
            expect(query.values.length).to.equal(2);
            expect(query.values[0]).to.equal('John');
            expect(query.values[1]).to.equal('Doe');
        });

		it("Table with WHERE clause, $and, $or, $eq", function() {
            var query = sqlbuilder.build({
                $select: {
                    $table: 'people',
                    $where: {
						$and : [
							{ first_name: 'John' },
	                        { last_name: { $eq: 'Doe' } },
							{ $or : [
								{ age : { $gt: 18 } },
	                            { gender : { $ne: 'female' } }
							]}
						]
                    }
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ? AND (`age` > ? OR `gender` != ?)');
            expect(query.values.length).to.equal(4);
            expect(query.values[0]).to.equal('John');
            expect(query.values[1]).to.equal('Doe');
			expect(query.values[2]).to.equal(18);
			expect(query.values[3]).to.equal('female');
        });

		it("Table with simple WHERE clause only $or", function() {
            var query = sqlbuilder.build({
                $select: {
                    $table: 'people',
                    $where: {
						$or: [
							{ first_name: 'John' },
	                        { last_name: { $eq: 'Doe' } }
						]
                    }
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? OR `last_name` = ?');
            expect(query.values.length).to.equal(2);
            expect(query.values[0]).to.equal('John');
            expect(query.values[1]).to.equal('Doe');
        });

		it("Table with GROUP BY", function() {
            var query = sqlbuilder.build({
                $select: {
					$columns: ['first_name', 'last_name'],
                    $table: 'people',
                    $groupBy: ['first_name', 'last_name']
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people` GROUP BY `first_name`, `last_name`');
            expect(query.values.length).to.equal(0);
        });

		it("Table with GROUP BY and HAVING clause", function() {
            var query = sqlbuilder.build({
                $select: {
					$columns: [
						'first_name',
						{ first_name_count: { $count: '*' } }
					],
                    $table: 'people',
                    $groupBy: ['first_name'],
					$having: {
						first_name_count: { $gt: 2 }
					}
                }
            });

            expect(query).to.be.instanceOf(SQLQuery);
            expect(query.sql).to.equal('SELECT `first_name`, COUNT(*) AS `first_name_count` FROM `people` GROUP BY `first_name` HAVING COUNT(*) > 2');
            expect(query.values.length).to.equal(0);
        });

    });
});
