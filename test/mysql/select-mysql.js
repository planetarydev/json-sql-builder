'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

// IMPORTANT - create a new instance with parameter "mysql"
var sqlbuilder   = new SQLBuilder('mysql');

describe('MySQL Query Operators', function() {

	describe('$select: { ... }', function() {
		describe('$calcFoundRows: true | false', function() {
			it('should return SQL_CALC_FOUND_ROWS', function() {
				var query = sqlbuilder.build({
					$select: {
						$columns: [
							'job_title',
							{ total_salary: { $sum: 'salary' } }
						],
						$table: 'people',
						$groupBy: ['job_title'],
						$calcFoundRows: true,
						$rollup: true
					}
				});

				expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT SQL_CALC_FOUND_ROWS `job_title`, SUM(`salary`) AS `total_salary` FROM `people` GROUP BY `job_title` WITH ROLLUP');
				expect(query.values.length).to.equal(0);
			});
		});

		describe('$rollup: true | false', function() {
			it('should return GROUP BY WITH ROLLUP', function() {
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

			it('should return GROUP BY without WITH ROLLUP on rollup:false', function() {
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
		});

		describe('$groupConcat: [...] | {...}', function() {
			it('should return GROUP_CONCAT operator', function() {
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

			it('should return GROUP_CONCAT with DISTINCT, SEPERATOR and ORDER BY, GROUP BY on using extended properties', function() {
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
		});

		describe('$limit: <number> | \'ALL\'', function() {
			it('should return LIMIT', function() {
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

			it('should return LIMIT ALL', function() {
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
		});

		describe('$offset: <number>', function() {
			it('should return LIMIT and OFFSET', function() {
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
		});

		describe('$into: [...] | { $outfile | $dumpfile }', function() {
			it('should return INTO clause with all array-items concatenated by `, `', function() {
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
		});

		describe('$outfile: { $file [, $fields, $lines] }', function() {
			it('should return INTO OUTFILE with options $terminatedBy, $enclosedBy, $escapedBy', function() {
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
	});


	describe('Error detection', function() {
		it('should throw error when using OFFSET without LIMIT', function() {
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

		it('should throw error when using $outfile without $file', function() {
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
