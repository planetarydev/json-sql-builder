'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI CREATE VIEW', function() {
	describe('$create: { ... }', function() {

		describe('$view: \'View-identifier\'', function() {
			it('should return CREATE VIEW Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$view: 'v_people',
						$select : {
							$from: 'people',
							$columns: [
								'first_name',
								'last_name'
							]
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE VIEW `v_people` AS SELECT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$view: using $cor: \'View-identifier\'', function() {
			it('should return CREATE OR REPLACE VIEW Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$view: { $cor: 'v_people' },
						$select : {
							$from: 'people',
							$columns: [
								'first_name',
								'last_name'
							]
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE OR REPLACE VIEW `v_people` AS SELECT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});

			it('should return CREATE OR REPLACE VIEW Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$cor: true, // $cor outside of the $view operator
						$view: 'v_people',
						$select : {
							$from: 'people',
							$columns: [
								'first_name',
								'last_name'
							]
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE OR REPLACE VIEW `v_people` AS SELECT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});
		});

	});
});
