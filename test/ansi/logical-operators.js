'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Logical Operator', function() {

	describe('$or', function() {
		it('should return concatenated array item-expressions with OR', function() {
			var query = sqlbuilder.build({
				$or: [
					{ first_name: 'John' },
					{ first_name: 'Jane' }
				]
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` = ? OR `first_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});

	});

	describe('$and', function() {
		it('should return concatenated array item-expressions with AND', function() {
			var query = sqlbuilder.build({
				$and: [
					{ first_name: 'John' },
					{ first_name: 'Jane' }
				]
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('`first_name` = ? AND `first_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Jane');
		});

	});
});
