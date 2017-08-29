'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Query Operators', function() {
	describe('$union: [ ... ]', function() {

		describe('$select: { ... }', function() {
			it('should return SELECT ... UNION SELECT ...', function() {
				var query = sqlbuilder.build({
					$union: [{
						$select: {
							$from: 'people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
						}}, {
						$select: {
							$from: 'more_people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
						}
					}]
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('(SELECT `first_name`, `last_name` FROM `people` WHERE `id` = ?) UNION (SELECT `first_name`, `last_name` FROM `more_people` WHERE `id` = ?)');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal(1);
				expect(query.values[1]).to.equal(1);
			});
		});

	});

	describe('$unionAll: [ ... ]', function() {

		describe('$select: { ... }', function() {
			it('should return SELECT ... UNION SELECT ...', function() {
				var query = sqlbuilder.build({
					$unionAll: [{
						$select: {
							$from: 'people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
						}}, {
						$select: {
							$from: 'more_people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
						}
					}]
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('(SELECT `first_name`, `last_name` FROM `people` WHERE `id` = ?) UNION ALL (SELECT `first_name`, `last_name` FROM `more_people` WHERE `id` = ?)');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal(1);
				expect(query.values[1]).to.equal(1);
			});
		});
	});

	describe('$unionEx: [ ... ]', function() {

		describe('$select: { ... }', function() {
			it('should return SELECT ... UNION SELECT ...', function() {
				var query = sqlbuilder.build({
					$unionAllEx: [{
							$from: 'people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
						}, {
							$from: 'more_people',
							$columns: ['first_name', 'last_name'],
							$where: { id: 1 }
					}],
					$sort: {
						last_name: 'DESC'
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('(SELECT `first_name`, `last_name` FROM `people` WHERE `id` = ?) UNION ALL (SELECT `first_name`, `last_name` FROM `more_people` WHERE `id` = ?) ORDER BY `last_name` DESC');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal(1);
				expect(query.values[1]).to.equal(1);
			});
		});
	});
});
