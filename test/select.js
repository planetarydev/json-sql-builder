'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../index');
const SQLQuery   = require('../lib/sqlquery');

var sqlbuilder   = new SQLBuilder('mysql');

describe('Check Helpers', function() {
	it('$select', function() {
		expect('$select' in sqlbuilder._helpers).to.equal(true);
	});
});


describe('Quering Statements', function() {
	describe('SELECT', function() {

		it('FROM Table', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people`');
			expect(query.values.length).to.equal(0);
		});

		it('FROM table AS alias', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: { people: { $as: 'alias_people' } }
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` AS `alias_people`');
			expect(query.values.length).to.equal(0);
		});


		it('columns as objects', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: {
						fixvalue: 'foo',
						first_name: { $val: 'John' },
						last_name: { $as: 'alias_last_name' },
						gender: { $val: 'male' }
					},
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT ? AS `fixvalue`, ? AS `first_name`, `last_name` AS `alias_last_name`, ? AS `gender` FROM `people`');
			expect(query.values.length).to.equal(3);
			expect(query.values[0]).to.equal('foo');
			expect(query.values[1]).to.equal('John');
			expect(query.values[2]).to.equal('male');
		});

		it('columns as array of strings', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: ['first_name', 'last_name'],
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people`');
			expect(query.values.length).to.equal(0);
		});

		it('columns as array of objects', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						{ first_name: { $val: 'John' } },
						{ last_name: { $as: 'alias_last_name' } },
						{ gender: { $val: 'male' } }
					],
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT ? AS `first_name`, `last_name` AS `alias_last_name`, ? AS `gender` FROM `people`');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('male');
		});

		it('DISTINCT columns as array of strings', function() {
			var query = sqlbuilder.build({
				$select: {
					$distinct: true,
					$columns: ['first_name', 'last_name'],
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT DISTINCT `first_name`, `last_name` FROM `people`');
			expect(query.values.length).to.equal(0);
		});

		it('WHERE clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$where: {
						first_name: 'John',
						last_name: 'Doe'
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});

		it('WHERE clause with condition $eq', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$where: {
						first_name: 'John',
						last_name: { $eq: 'Doe' }
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});

		it('WHERE clause with extended conditions $and, $or, $eq', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
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

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? AND `last_name` = ? AND (`age` > ? OR `gender` != ?)');
			expect(query.values.length).to.equal(4);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
			expect(query.values[2]).to.equal(18);
			expect(query.values[3]).to.equal('female');
		});

		it('WHERE clause only $or', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$where: {
						$or: [
							{ first_name: 'John' },
							{ last_name: { $eq: 'Doe' } }
						]
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` WHERE `first_name` = ? OR `last_name` = ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});

		it('GROUP BY', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: ['first_name', 'last_name'],
					$table: 'people',
					$groupBy: ['first_name', 'last_name']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `first_name`, `last_name` FROM `people` GROUP BY `first_name`, `last_name`');
			expect(query.values.length).to.equal(0);
		});

		it('GROUP BY, WITH ROLLUP', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ total_salary: { $sum: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title'],
					$rollup: true
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title` WITH ROLLUP');
			expect(query.values.length).to.equal(0);
		});

		it('GROUP BY, WITH ROLLUP:false', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ total_salary: { $sum: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title'],
					$rollup: false
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title`');
			expect(query.values.length).to.equal(0);
		});

		it('GROUP BY with HAVING clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'first_name',
						{ first_name_count: { $count: '*' } }
					],
					$table: 'people',
					$groupBy: ['first_name'],
					$having: {
						$expr: { $count: '*', $gt: 2 }
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `first_name`, COUNT(*) AS `first_name_count` FROM `people` GROUP BY `first_name` HAVING COUNT(*) > ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(2);
		});

		it('SUM, GROUP BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ total_salary: { $sum: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title`');
			expect(query.values.length).to.equal(0);
		});

		it('MIN, GROUP BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ min_salary: { $min: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_title`, MIN(`salary`) AS `min_salary` FROM `people` GROUP BY `job_title`');
			expect(query.values.length).to.equal(0);
		});

		it('MAX, GROUP BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_title',
						{ max_salary: { $max: 'salary' } }
					],
					$table: 'people',
					$groupBy: ['job_title']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_title`, MAX(`salary`) AS `max_salary` FROM `people` GROUP BY `job_title`');
			expect(query.values.length).to.equal(0);
		});

		it('GROUP_CONCAT, GROUP BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_position',
						{ job_title_list: { $groupConcat: 'job_title' } }
					],
					$table: 'people',
					$groupBy: ['job_position']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_position`, GROUP_CONCAT(`job_title`) AS `job_title_list` FROM `people` GROUP BY `job_position`');
			expect(query.values.length).to.equal(0);
		});

		it('GROUP_CONCAT with DISTINCT, SEPERATOR and ORDER BY, GROUP BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: [
						'job_position',
						{ job_title_list: { $groupConcat: { $column: 'job_title', $distinct: true, $sort:['job_title'], $separator: '; ' } } }
					],
					$table: 'people',
					$groupBy: ['job_position']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `job_position`, GROUP_CONCAT(DISTINCT `job_title` ORDER BY `job_title` SEPERATOR ?) AS `job_title_list` FROM `people` GROUP BY `job_position`');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal('; ');
		});

		it('ORDER BY clause', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: ['last_name', 'first_name']
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name`, `first_name`');
			expect(query.values.length).to.equal(0);
		});

		it('ORDER BY as array using ASC, DESC helper', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: [
						{ last_name : { $asc: true } },
						{ first_name : { $desc: true } }
					]
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
			expect(query.values.length).to.equal(0);
		});

		it('ORDER BY clause as array of objects using ASC DESC def by value', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: [
						{ last_name : 'ASC' },
						{ first_name : 'DESC' }
					]
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
			expect(query.values.length).to.equal(0);
		});

		it('ORDER BY clause as array of objects using ASC, DESC def by number', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: [
						{ last_name : 1 },
						{ first_name : -1 }
					]
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
			expect(query.values.length).to.equal(0);
		});

		it('ORDER BY clause as object using ASC, DESC def by value', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: {
						last_name : 'ASC',
						first_name : 'DESC'
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
			expect(query.values.length).to.equal(0);
		});

		it('ORDER BY clause as object using ASC, DESC def by number', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$sort: {
						last_name : 1,
						first_name : -1
					}
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` ORDER BY `last_name` ASC, `first_name` DESC');
			expect(query.values.length).to.equal(0);
		});

		it('LIMIT', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$limit: 50
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` LIMIT ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(50);
		});

		it('LIMIT ALL', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$limit: 'ALL'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` LIMIT ?');
			expect(query.values.length).to.equal(1);
			expect(query.values[0]).to.equal(18446744073709551615);
		});

		it('LIMIT OFFSET', function() {
			var query = sqlbuilder.build({
				$select: {
					$table: 'people',
					$limit: 50,
					$offset: 10
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT * FROM `people` LIMIT ? OFFSET ?');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal(50);
			expect(query.values[1]).to.equal(10);
		});

		it('INTO', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: ['first_name', 'last_name'],
					$into: ['@firstname', '@lastname'],
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `first_name`, `last_name` INTO @firstname, @lastname FROM `people`');
			expect(query.values.length).to.equal(0);
		});

		it('INTO OUTFILE', function() {
			var query = sqlbuilder.build({
				$select: {
					$columns: ['first_name', 'last_name'],
					$into: {
						$outfile: {
							$file: '/tmp/people.txt',
							$fields: { $terminatedBy: ', ', $enclosedBy: '"', $escapedBy: '\\' },
							$lines: { $terminatedBy: '\n' }
						}
					},
					$table: 'people'
				}
			});

			expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT `first_name`, `last_name` INTO OUTFILE ? FIELDS TERMINATED BY ? ENCLOSED BY ? ESCAPED BY ? LINES TERMINATED BY ? FROM `people`');
			expect(query.values.length).to.equal(5);
			expect(query.values[0]).to.equal('/tmp/people.txt');
			expect(query.values[1]).to.equal(', ');
			expect(query.values[2]).to.equal('"');
			expect(query.values[3]).to.equal('\\');
			expect(query.values[4]).to.equal('\n');
		});
	});


	describe('Error detection', function() {
		it('SELECT with OFFSET and without LIMIT -> Error', function() {
			try {
				var query = sqlbuilder.build({
					$select: {
						$table: 'people',
						$offset: 10
					}
				});
			} catch (err) {
				expect(err.message).to.equal('Can\'t use $offset without $limit.');
			}
		});

		it('SELECT INTO OUFILE without $file -> Error', function() {
			try {
				var query = sqlbuilder.build({
					$select: {
						$columns: ['first_name', 'last_name'],
						$into: {
							$outfile: {
								$fields: { $terminatedBy: ', ', $enclosedBy: '"', $escapedBy: '\\' },
								$lines: { $terminatedBy: '\n' }
							}
						},
						$table: 'people'
					}
				});
			} catch (err) {
				expect(err.message).to.equal('Required expression missing: $file.');
			}
		});
	});
});
