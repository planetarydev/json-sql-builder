'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

// IMPORTANT - create a new instance with parameter "mysql"
var sqlbuilder   = new SQLBuilder('mysql');

describe('MySQL Standard', function() {
	describe('Identifier quotation', function() {
		it('should return back-ticks like `table`.`column`', function() {
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
			expect(query.sql).to.equal('SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title`');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('Placeholder terms', function() {
		it('should return ? for each value placeholder', function() {
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
			expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});
	});
});
