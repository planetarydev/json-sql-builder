'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

describe('ANSI Query Operators', function() {
	describe('$select: { ... }', function() {

		describe('minimum select requirements', function() {
			it('should return SELECT with one column', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							my_first_col: { $val: 'Hello World' }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT ? AS `my_first_col`');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal('Hello World');
			});
		});

		describe('$from', function() {
			it('should return SELECT ... FROM `table-identifier`', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people`');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$from: { $as: <aliasname> }', function() {
			it('should return SELECT ... FROM `table-identifier` AS `alias`', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: { people: 'alias_people' }
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` AS `alias_people`');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$columns: [...] | {...}', function() {
			it('should return all column object-properties concatenated with `, `', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							fixvalue: { $val: 'foo' },
							first_name: { $val: 'John' },
							last_name: 'alias_last_name', //{ $as: 'alias_last_name' },
							gender: { $val: 'male' }
						},
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT ? AS `fixvalue`, ? AS `first_name`, `last_name` AS `alias_last_name`, ? AS `gender` FROM `people`');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal('foo');
				expect(query.values[1]).to.equal('John');
				expect(query.values[2]).to.equal('male');
			});

			it('should return all column array-items (strings) concatenated with `, `', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: ['first_name', 'last_name'],
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});

			it('should return all column array-items (objects) concatenated with `, `', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							first_name: { $val: 'John' },
							last_name: 'alias_last_name', //: { $as: 'alias_last_name' },
							gender: { $val: 'male' }
						},
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT ? AS `first_name`, `last_name` AS `alias_last_name`, ? AS `gender` FROM `people`');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('male');
			});
		});

		describe('$distinct: true | false', function() {
			it('should return DISTINCT on true', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$distinct: true,
						$columns: ['first_name', 'last_name'],
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT DISTINCT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});

			it('should return empty string on false', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$distinct: false,
						$columns: ['first_name', 'last_name'],
						$from: 'people'
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people`');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$where: { ... }', function() {
			it('should return WHERE with all object-expressions concatenated by AND', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$where: {
							first_name: 'John',
							last_name: 'Doe'
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
			});

			it('should return WHERE with all object-expressions using comparison operator $eq concatenated by AND ', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$where: {
							first_name: 'John',
							last_name: { $eq: 'Doe' }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
			});

			it('should return WHERE with all object-expressions with mixed logical and comparison operators $and, $or, $eq', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$where: {
							$and : [
								{ first_name: 'John' },
								{ last_name: { $eq: 'Doe' } },
								{ $or : [
									{ age : { $gt: 18 } },
									{ gender : { $ne: 'female' } }
								]}
							]
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ? AND (`age` > ? OR `gender` != ?)');
				expect(query.values.length).to.equal(4);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
				expect(query.values[2]).to.equal(18);
				expect(query.values[3]).to.equal('female');
			});

			it('should return WHERE with all object-expressions concatenated by OR', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$where: {
							$or: [
								{ first_name: 'John' },
								{ last_name: { $eq: 'Doe' } }
							]
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? OR `last_name` = ?');
				expect(query.values.length).to.equal(2);
				expect(query.values[0]).to.equal('John');
				expect(query.values[1]).to.equal('Doe');
			});
		}); // $where

		describe('$groupBy: { ... } | [ ... ]', function() {
			it('should return GROUP BY with all array items concatenated by `, `', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: ['first_name', 'last_name'],
						$from: 'people',
						$groupBy: ['first_name', 'last_name']
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people` GROUP BY `first_name`, `last_name`');
				expect(query.values.length).to.equal(0);
			});

			it('should return GROUP BY with all array items concatenated by `, ` and SUM aggregation', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							job_title: 1,
							total_salary: { $sum: 'salary' }
						},
						$from: 'people',
						$groupBy: ['job_title']
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title`');
				expect(query.values.length).to.equal(0);
			});
		}); // $groupBy

		describe('$having: { ... }', function() {
			it('should return HAVING clause with extended expression', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							first_name: 1,
							first_name_count: { $count: '*' }
						},
						$from: 'people',
						$groupBy: ['first_name'],
						$having: {
							$expr: { $count: '*', $gt: 2 }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT `first_name`, COUNT(*) AS `first_name_count` FROM `people` GROUP BY `first_name` HAVING COUNT(*) > ?');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal(2);
			});

		}); // $groupBy

		describe('$sort: [ ... ] | { ... }', function() {
			it('should return ORDER BY clause with all columns concatenated by `, `', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: ['last_name', 'first_name']
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name`, `first_name`');
				expect(query.values.length).to.equal(0);
			});

			it('should return ORDER BY clause with ASC, DESC using $asc and $desc', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: [
							{ last_name : { $asc: true } },
							{ first_name : { $desc: true } }
						]
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
				expect(query.values.length).to.equal(0);
			});

			it('should return ORDER BY clause using ASC, DESC defined by value', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: [
							{ last_name : 'ASC' },
							{ first_name : 'DESC' }
						]
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
				expect(query.values.length).to.equal(0);
			});

			it('should return ORDER BY clause using ASC, DESC defined by number 1 | -1', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: [
							{ last_name : 1 },
							{ first_name : -1 }
						]
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
				expect(query.values.length).to.equal(0);
			});

			it('should return ORDER BY clause defined as object using ASC, DESC by value', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: {
							last_name : 'ASC',
							first_name : 'DESC'
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
				expect(query.values.length).to.equal(0);
			});

			it('should return ORDER BY clause defined as object using ASC, DESC by number 1 | -1', function() {
				var sqlbuilder   = new SQLBuilder();
				var query = sqlbuilder.build({
					$select: {
						$from: 'people',
						$sort: {
							last_name : 1,
							first_name : -1
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
				expect(query.values.length).to.equal(0);
			});
		});
	});

	describe('Sub-Select support', function() {
		it('should return sub-select\'s in round brackets', function() {
			var sqlbuilder   = new SQLBuilder();
			var query = sqlbuilder.build({
				$select: {
					$columns: {
						first_name: { $val: 'John' },
						likes: {
							$select: {
								$from: 'people_likes',
								$columns: {
									totalLikes: { $count: '*' }
								},
								$where: {
									'people.id': { $eq: '~~people_likes.people_id' }
								}
							}
						}
					},
					$from: 'people'
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT ? AS `first_name`, (SELECT COUNT(*) AS `totalLikes` FROM `people_likes` WHERE `people`.`id` = `people_likes`.`people_id`) AS `likes` FROM `people`');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('John');
		});
	});
});
