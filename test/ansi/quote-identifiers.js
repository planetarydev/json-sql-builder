'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('Quote identifiers', function() {
	describe('$table, $from : `table-identifier`', function() {
		it('should return DELETE FROM `table-identifier`', function() {
			var query = sqlbuilder.build({
				$delete: {
					$table: 'people'
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('DELETE FROM `people`');
			expect(query.values.length).to.equal(0);
		});

		it('should return SELECT * FROM `table-identifier`', function() {
			var query = sqlbuilder.build({
				$select: {
					$from: 'people'
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people`');
		});
	});

	describe('$table, $from : `schema`.`table-identifier`', function() {
		it('should return DELETE FROM `schema`.`table-identifier`', function() {
			var query = sqlbuilder.build({
				$delete: {
					$table: 'public.people'
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('DELETE FROM `public`.`people`');
			expect(query.values.length).to.equal(0);
		});

		it('should return SELECT * FROM `schema`.`table-identifier`', function() {
			var query = sqlbuilder.build({
				$select: {
					$from: 'public.people'
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `public`.`people`');
		});
	});

});
