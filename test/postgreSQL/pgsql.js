'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

// IMPORTANT - create a new instance with parameter "postgreSQL"
var sqlbuilder   = new SQLBuilder('postgreSQL');

describe('postgreSQL Standard', function() {
	describe('Identifier quotation', function() {
		it('should return double-quotes like "table"."column"', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ total_salary: { $sum: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT "job_title", SUM("salary") AS "total_salary" FROM "people" GROUP BY "job_title"');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('Placeholder terms', function() {
		it('should return $1, $2, etc. for value placeholders', function() {
			var query = sqlbuilder.build({
				$select: {
					$from: 'people',
					$where: {
						first_name: 'John',
						last_name: 'Doe'
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM "people" WHERE "first_name" = $1 AND "last_name" = $2');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});
	});
});
