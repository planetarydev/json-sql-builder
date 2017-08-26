'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Aggregation Operator', function() {

	describe('$count', function() {
		it('should return COUNT(*) AS `identifier` by using \'*\'', function() {
			var query = sqlbuilder.build({
				total_salary: { $count: '*' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('COUNT(*) AS `total_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return COUNT(`column`) AS `identifier`', function() {
			var query = sqlbuilder.build({
				total_salary: { $count: 'salary' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('COUNT(`salary`) AS `total_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return COUNT(*) without identifier', function() {
			var query = sqlbuilder.build({
				$count: '*'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('COUNT(*)');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$sum', function() {
		it('should return SUM(`column`) AS `identifier`', function() {
			var query = sqlbuilder.build({
				total_salary: { $sum: 'salary' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SUM(`salary`) AS `total_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return SUM(`column`) without identifier', function() {
			var query = sqlbuilder.build({
				$sum: 'salary'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SUM(`salary`)');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$min', function() {
		it('should return MIN(`column`) AS `identifier`', function() {
			var query = sqlbuilder.build({
				min_salary: { $min: 'salary' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('MIN(`salary`) AS `min_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return SUM(`column`) without identifier', function() {
			var query = sqlbuilder.build({
				$min: 'salary'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('MIN(`salary`)');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$max', function() {
		it('should return MAX(`column`) AS `identifier`', function() {
			var query = sqlbuilder.build({
				max_salary: { $max: 'salary' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('MAX(`salary`) AS `max_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return MAX(`column`) without identifier', function() {
			var query = sqlbuilder.build({
				$max: 'salary'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('MAX(`salary`)');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$avg', function() {
		it('should return AVG(`column`) AS `identifier`', function() {
			var query = sqlbuilder.build({
				avg_salary: { $avg: 'salary' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('AVG(`salary`) AS `avg_salary`');
			expect(query.values.length).to.equal(0);
		});

		it('should return AVG(`column`) without identifier', function() {
			var query = sqlbuilder.build({
				$avg: 'salary'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('AVG(`salary`)');
			expect(query.values.length).to.equal(0);
		});
	});
});
