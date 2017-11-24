'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI CREATE INDEX', function() {
	describe('$create: { ... }', function() {

		describe('$index: \'Index-identifier\'', function() {
			it('should return CREATE INDEX Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$index: 'idx_people_last_name',
						$table: 'people',
						$columns: [
							{last_name: { $asc: true }},
							{first_name: { $asc: true }},
						],
						$using: 'BTREE'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE INDEX `idx_people_last_name` ON `people` USING BTREE (`last_name` ASC, `first_name` ASC)');
				expect(query.values.length).to.equal(0);
			});
		});

	});
});
