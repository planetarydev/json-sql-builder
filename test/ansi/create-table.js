'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI CREATE TABLE', function() {
	describe('$create: { ... }', function() {

		describe('$table: \'table-identifier\'', function() {
			it('should return CREATE TABLE `table-identifier` Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							username: { $column: { $type: 'TEXT' } },
							first_name: { $column: { $type: 'TEXT' } },
							last_name: { $column: { $type: 'TEXT', $default: 'John' } },
							createdAt: { $column: { $type: 'DATETIME', $notNull: true } },
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE `users` (`_id` VARCHAR (32) NOT NULL, `username` TEXT, `first_name` TEXT, `last_name` TEXT DEFAULT ?, `createdAt` DATETIME NOT NULL)');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal('John');
			});
		});

		describe('$temp: true', function() {
			it('should return CREATE TEMPORARY TABLE `table-identifier` Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$temp: true,
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } }
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TEMPORARY TABLE `users` (`_id` VARCHAR (32) NOT NULL)');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$ine: true', function() {
			it('should return CREATE TABLE IF NOT EXISTS `table-identifier` Statement', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$ine: true,
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } }
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE IF NOT EXISTS `users` (`_id` VARCHAR (32) NOT NULL)');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$constraint: { ... }', function() {
			it('should return CREATE TABLE `table-identifier` Statement with CONSTRAINTS', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							username: { $column: { $type: 'TEXT' } },
							first_name: { $column: { $type: 'TEXT' } },
							last_name: { $column: { $type: 'TEXT', $default: 'John' } },
							createdAt: { $column: { $type: 'DATETIME', $notNull: true } },

							pk_users: { $constraint: { $primary: true, $columns: '_id' } },
							uc_users_username: { $constraint: { $unique: true, $columns: 'username' } }
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('CREATE TABLE `users` (`_id` VARCHAR (32) NOT NULL, `username` TEXT, `first_name` TEXT, `last_name` TEXT DEFAULT ?, `createdAt` DATETIME NOT NULL, CONSTRAINT `pk_users` PRIMARY KEY (`_id`), CONSTRAINT `uc_users_username` UNIQUE (`username`))');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal('John');
			});
		});

		describe('$constraints: { $foreignKey }', function() {
			it('should return CREATE TABLE `table-identifier` Statement with UNIQUE and FOREIGN-KEY constraints', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							username: { $column: { $type: 'TEXT' } },
							first_name: { $column: { $type: 'TEXT' } },
							last_name: { $column: { $type: 'TEXT', $default: 'John' } },
							createdAt: { $column: { $type: 'DATETIME', $notNull: true } },

							fk_users_emails: {
								$constraint: {
									$foreignKey: true,
									$columns: '_id',
									$references: {
										$table: 'user_emails',
										$columns: 'user_id',
										$onDelete: 'CASCADE',
										$onUpdate: 'RESTRICT'
									}
								}
							},
							uc_users_username: {
								$constraint: {
									$unique: true,
									$columns: 'username'
								}
							}
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);

				var sql = 'CREATE TABLE `users` ('
				sql += '`_id` VARCHAR (32) NOT NULL, `username` TEXT, `first_name` TEXT, `last_name` TEXT DEFAULT ?, `createdAt` DATETIME NOT NULL, ';
				sql += 'CONSTRAINT `fk_users_emails` FOREIGN KEY (`_id`) REFERENCES `user_emails` (`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT, '
				sql += 'CONSTRAINT `uc_users_username` UNIQUE (`username`)'
				sql += ')';
				expect(query.sql).to.equal(sql);
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal('John');
			});
		});

		describe('$constraints: { $check }', function() {
			it('should return CREATE TABLE `table-identifier` Statement with a simple CHECK constraint', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							username: { $column: { $type: 'TEXT' } },
							first_name: { $column: { $type: 'TEXT' } },
							last_name: { $column: { $type: 'TEXT', $default: 'John' } },
							age: { $column: { $type: 'INTEGER', $notNull: true } },

							user_must_be_older_than_18: {
								$constraint: {
									$check: { age: { $gte: 18 } }
								}
							}
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);

				var sql = 'CREATE TABLE `users` ('
				sql += '`_id` VARCHAR (32) NOT NULL, `username` TEXT, `first_name` TEXT, `last_name` TEXT DEFAULT ?, `age` INTEGER NOT NULL, ';
				sql += 'CONSTRAINT `user_must_be_older_than_18` CHECK (`age` >= ?)'
				sql += ')';
				expect(query.sql).to.equal(sql);
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal(18);
			});

			it('should return CREATE TABLE `table-identifier` Statement with a more complex CHECK constraint', function() {
				var query = sqlbuilder.build({
					$create: {
						$table: 'users',
						$define: {
							_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
							username: { $column: { $type: 'TEXT' } },
							first_name: { $column: { $type: 'TEXT' } },
							last_name: { $column: { $type: 'TEXT', $default: 'John' } },
							age: { $column: { $type: 'INTEGER', $notNull: true } },

							user_must_be_older_than_18: {
								$constraint: {
									$check: {
										$or: [
											{ age: { $gte: 18 } },
											{ username: { $eq: 'Admin' } }
										]
									}
								}
							}
						}
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);

				var sql = 'CREATE TABLE `users` ('
				sql += '`_id` VARCHAR (32) NOT NULL, `username` TEXT, `first_name` TEXT, `last_name` TEXT DEFAULT ?, `age` INTEGER NOT NULL, ';
				sql += 'CONSTRAINT `user_must_be_older_than_18` CHECK (`age` >= ? OR `username` = ?)'
				sql += ')';
				expect(query.sql).to.equal(sql);
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal(18);
				expect(query.values[2]).to.equal('Admin');
			});
		});

	});
});
