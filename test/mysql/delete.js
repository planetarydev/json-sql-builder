'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('mysql');

describe('MySQL Query Operators', function() {
	describe('$delete: { ... }', function() {

		describe('$table: \'table-identifier\', $where: {}, $sort: {}, $limit: 0', function() {

			it('should return DELETE FROM `table-identifier` WHERE ... ORDER BY ... LIMIT ...', function() {
				var query = sqlbuilder.build({
					$delete: {
						$table: 'people',
						$where: { first_name: { $startsWith: 'J' } },
						$sort: {
							first_name: 1
						},
						$limit: 2
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('DELETE FROM `people` WHERE `first_name` LIKE ? ORDER BY `first_name` ASC LIMIT ?');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('J%');
				expect(query.values[1]).to.equal(2);
			});

		});

	});
});
