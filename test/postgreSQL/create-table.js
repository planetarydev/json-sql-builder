'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('postgreSQL');

describe('PostgreSQL specific CREATE TABLE', function() {
	describe('$create: { ... }', function() {

		describe('$default: true', function() {
			it('should return CREATE TABLE `table-identifier` with DEFAULT "t" on BOOL column', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							test: { $column: { $type: 'BOOLEAN', $notNull: true, $default: true } }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE "users" ("_id" VARCHAR (32) NOT NULL, "test" BOOLEAN NOT NULL DEFAULT \'t\')');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$unlogged: true', function() {
			it('should return CREATE UNLOGGED TABLE `table-identifier` Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$unlogged: true,
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE UNLOGGED TABLE "users" ("_id" VARCHAR (32) NOT NULL)');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$with: { ... }', function() {
			it('should return CREATE TABLE `table-identifier` Statement with WITH clause', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } }
						},
						$with: { $oids: true }
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE "users" ("_id" VARCHAR (32) NOT NULL) WITH (OIDS = TRUE)');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$tablespace: { ... }', function() {
			it('should return CREATE TABLE `table-identifier` Statement with TABLESPACE option', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } }
						},
						$tablespace: 'my_table_space'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE "users" ("_id" VARCHAR (32) NOT NULL) TABLESPACE "my_table_space"');
				expect(query.values.length).to.equal(0);
			});
		});

	});
});
