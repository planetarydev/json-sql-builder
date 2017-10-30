'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

// IMPORTANT - create a new instance with parameter "postgreSQL"
var sqlbuilder   = new SQLBuilder('postgreSQL');

describe('MySQL Query Operators', function() {

	describe('$select: { ... }', function() {

		describe('$limit: <number> | \'ALL\'', function() {
			it('should return LIMIT', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$limit: 50
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM "people" LIMIT $1');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal(50);
			});

			it('should return LIMIT ALL', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$limit: 'ALL'
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM "people" LIMIT ALL');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$offset: <number>', function() {
			it('should return LIMIT and OFFSET', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$limit: 50,
						$offset: 10
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM "people" LIMIT $1 OFFSET $2');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal(50);
				expect(query.values[1]).to.equal(10);
			});
		});

	});

});
