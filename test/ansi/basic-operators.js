'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Basic Operator', function() {

	describe('$as', function() {
		it('should return `expression` AS `identifier', function() {
			var query = sqlbuilder.build({
				first_name: { $as: 'alias_for_first_name' }
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` AS `alias_for_first_name`');
			expect(query.values.length).to.equal(0);
		});

		it('should return AS `identifier without expression', function() {
			var query = sqlbuilder.build({
				$as: 'alias'
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('AS `alias`');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$alias', function() {
		it('should return `expression` AS `identifier', function() {
			var query = sqlbuilder.build({
				first_name: { $alias: 'alias_for_first_name' }
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` AS `alias_for_first_name`');
			expect(query.values.length).to.equal(0);
		});

		it('should return AS `identifier without expression', function() {
			var query = sqlbuilder.build({
				$alias: 'alias'
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('AS `alias`');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$expr', function() {
		it('should return any expression defined', function() {
			var query = sqlbuilder.build({
				$expr: { $alias: 'alias_for_first_name' }
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('AS `alias_for_first_name`');
			expect(query.values.length).to.equal(0);
		});

		it('should return concatenation of each single expression if there is more than one', function() {
			var query = sqlbuilder.build({
				$expr: { $sum: 'salary', $gt : 3000 }
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SUM(`salary`) > ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});
	});

	/* removed / changed since 1.0.13 to $column definition used by $create -> $table -> $define
	describe('$column', function() {
		it('should return any column as quoted identifier', function() {
			var query = sqlbuilder.build({
				$column: 'first_name'
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name`');
			expect(query.values.length).to.equal(0);
		});
	});*/

	describe('$inc', function() {
		it('should return increment with quoted identifier', function() {
			var query = sqlbuilder.build({
				$set:{
					age: { $inc: 5 }
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`age` = `age` + ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(5);
		});
	});

	describe('$dec', function() {
		it('should return decrement with quoted identifier', function() {
			var query = sqlbuilder.build({
				$set:{
					age: { $dec: 5 }
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`age` = `age` - ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(5);
		});
	});

	describe('$val', function() {
		it('should return a placeholder with a fix value without identifier', function() {
			var query = sqlbuilder.build({
				$val: 'Hello World'
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('Hello World');
		});

	});
});
