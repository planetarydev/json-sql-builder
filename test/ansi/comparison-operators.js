'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Comparison Operator', function() {

	describe('$eq', function() {
		it('should return `identifier` = ?', function() {
			var query = sqlbuilder.build({
				first_name: { $eq: 'John' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` = ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('John');
		});

		it('should return = ? without identifier', function() {
			var query = sqlbuilder.build({
				$eq: 'John'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('John');
		});
	});

	describe('$ne', function() {
		it('should return `identifier` != ?', function() {
			var query = sqlbuilder.build({
				first_name: { $ne: 'John' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` != ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('John');
		});

		it('should return != ? without identifier', function() {
			var query = sqlbuilder.build({
				$ne: 'John'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('!= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('John');
		});
	});

	describe('$gt', function() {
		it('should return `identifier` > ?', function() {
			var query = sqlbuilder.build({
				salary: { $gt: 3000 }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`salary` > ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});

		it('should return > ? without identifier', function() {
			var query = sqlbuilder.build({
				$gt: 3000
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('> ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});
	});

	describe('$gte', function() {
		it('should return `identifier` >= ?', function() {
			var query = sqlbuilder.build({
				salary: { $gte: 3000 }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`salary` >= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});

		it('should return >= ? without identifier', function() {
			var query = sqlbuilder.build({
				$gte: 3000
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('>= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});
	});


	describe('$lt', function() {
		it('should return `identifier` < ?', function() {
			var query = sqlbuilder.build({
				salary: { $lt: 3000 }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`salary` < ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});

		it('should return < ? without identifier', function() {
			var query = sqlbuilder.build({
				$lt: 3000
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('< ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});
	});

	describe('$lte', function() {
		it('should return `identifier` <= ?', function() {
			var query = sqlbuilder.build({
				salary: { $lte: 3000 }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`salary` <= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});

		it('should return <= ? without identifier', function() {
			var query = sqlbuilder.build({
				$lte: 3000
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('<= ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(3000);
		});
	});

	describe('$in', function() {
		it('should return `identifier` IN (?, ?)', function() {
			var query = sqlbuilder.build({
				first_name: { $in: ['John', 'Jane'] }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` IN (?, ?)');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});

		it('should return IN (?, ?) without identifier', function() {
			var query = sqlbuilder.build({
				$in: ['John', 'Jane']
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('IN (?, ?)');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});
	});

	describe('$nin', function() {
		it('should return `identifier` NOT IN (?, ?)', function() {
			var query = sqlbuilder.build({
				first_name: { $nin: ['John', 'Jane'] }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` NOT IN (?, ?)');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});

		it('should return NOT IN (?, ?) without identifier', function() {
			var query = sqlbuilder.build({
				$nin: ['John', 'Jane']
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('NOT IN (?, ?)');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});
	});

	describe('$startsWith', function() {
		it('should return `identifier` LIKE ?', function() {
			var query = sqlbuilder.build({
				first_name: { $startsWith: 'J' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('J%');
		});

		it('should return LIKE ? without identifier', function() {
			var query = sqlbuilder.build({
				$startsWith: 'J'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('J%');
		});
	});

	describe('$endsWith', function() {
		it('should return `identifier` LIKE ?', function() {
			var query = sqlbuilder.build({
				first_name: { $endsWith: 'J' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('%J');
		});

		it('should return LIKE ? without identifier', function() {
			var query = sqlbuilder.build({
				$endsWith: 'J'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('%J');
		});
	});

	describe('$contains', function() {
		it('should return `identifier` LIKE ?', function() {
			var query = sqlbuilder.build({
				first_name: { $contains: 'J' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('%J%');
		});

		it('should return LIKE ? without identifier', function() {
			var query = sqlbuilder.build({
				$contains: 'J'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('%J%');
		});
	});

	describe('$like', function() {
		it('should return `identifier` LIKE ?', function() {
			var query = sqlbuilder.build({
				first_name: { $like: 'J_hn%' }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('J_hn%');
		});

		it('should return LIKE ? without identifier', function() {
			var query = sqlbuilder.build({
				$like: 'J_hn%'
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('LIKE ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('J_hn%');
		});
	});

	describe('$isNull: true', function() {
		it('should return `identifier` IS NULL ?', function() {
			var query = sqlbuilder.build({
				first_name: { $isNull: true }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` IS NULL');
			expect(query.values.length).to.equal(0);
		});

		it('should return IS NULL without identifier', function() {
			var query = sqlbuilder.build({
				$isNull: true
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('IS NULL');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$isNull: false', function() {
		it('should return `identifier` IS NOT NULL ?', function() {
			var query = sqlbuilder.build({
				first_name: { $isNull: false }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` IS NOT NULL');
			expect(query.values.length).to.equal(0);
		});

		it('should return IS NOT NULL without identifier', function() {
			var query = sqlbuilder.build({
				$isNull: false
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('IS NOT NULL');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('$between', function() {
		it('should return `identifier` BETWEEN ? AND ?', function() {
			var query = sqlbuilder.build({
				salary: { $between: [2000, 3000] }
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`salary` BETWEEN ? AND ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal(2000);
			expect(query.values[1]).to.equal(3000);
		});

		it('should return BETWEEN ? AND ? without identifier', function() {
			var query = sqlbuilder.build({
				$between: [2000, 3000]
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('BETWEEN ? AND ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal(2000);
			expect(query.values[1]).to.equal(3000);
		});
	});
});
