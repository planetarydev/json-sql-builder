'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Query Operators', function() {
	describe('$delete: { ... }', function() {

		describe('$table: \'table-identifier\'', function() {
			it('should return DELETE FROM `table-identifier`', function() {
				var query = sqlbuilder.build({
					$delete: {
						$table: 'people'
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('DELETE FROM `people`');
				expect(query.values.length).to.equal(0);
			});

			it('should return DELETE FROM `table-identifier` WHERE ...', function() {
				var query = sqlbuilder.build({
					$delete: {
						$table: 'people',
						$where: { id: 75375	}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('DELETE FROM `people` WHERE `id` = ?');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal(75375);
			});

		});

	});
});
