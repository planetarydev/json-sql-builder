'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

describe('MySQL Standard', function() {
	describe('Identifier quotation', function() {
		it('should return back-ticks like `table`.`column`', function() {
			// IMPORTANT - create a new instance with parameter "mysql"
			var sqlbuilder   = new SQLBuilder('mysql');
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
	});

	describe('Placeholder terms', function() {
		it('should return ? for each value placeholder', function() {
			// IMPORTANT - create a new instance with parameter "mysql"
			var sqlbuilder   = new SQLBuilder('mysql');
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
	});

	describe('String Functions', function() {
		describe('$left', function() {
			it('should return LEFT(str, ?)', function() {
				// IMPORTANT - create a new instance with parameter "mysql"
				var sqlbuilder   = new SQLBuilder('mysql');
				var query = sqlbuilder.build({
					$select: {
						$columns: {
							first_name_2lc: { $left: { $text: '~~first_name', $n: 2 } }
						},
						$from: 'people',
						$where: {
							first_name: 'John',
							last_name: 'Doe'
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT LEFT(`first_name`, ?) AS `first_name_2lc` FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
				expect(query.values.length).to.equal(3);
				expect(query.values[0]).to.equal(2);
				expect(query.values[1]).to.equal('John');
				expect(query.values[2]).to.equal('Doe');
			});
		});
		describe('$concat', function() {
			it('should return LEFT(str, ?)', function() {
				// IMPORTANT - create a new instance with parameter "mysql"
				var sqlbuilder   = new SQLBuilder('mysql');
				let $ql = sqlbuilder;
				/*$ql.left = function(ident, length) {
					return function(){
						return 'LEFT(' + this.addValue(ident) + ', ' + this.addValue(length) + ')';
					}
				}*/
				$ql.concat = function() {
					let args = [arguments[0], arguments[1]]
					return function() {
						return 'CONCAT(' + args.map((arg)=>{
							if (typeof arg == 'function') return arg.call(this);
							return this.addValue(arg);
						}).join(', ') + ')';
					}
				}
				var query = $ql.build({
					$select: {
						$columns: {
							//first_name_2lc: { $concat:[ { $left:['first_name', 2] }, '-Hallo'] }
							first_name_2lc: $ql.concat($ql.left('~~first_name', 2), '-Hallo')
						},
						$from: 'people',
						$where: {
							first_name: 'John',
							last_name: 'Doe'
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT CONCAT(LEFT(`first_name`, ?), ?) AS `first_name_2lc` FROM `people` WHERE `first_name` = ? AND `last_name` = ?');
				expect(query.values.length).to.equal(4);
				expect(query.values[0]).to.equal(2);
				expect(query.values[1]).to.equal('-Hallo');
				expect(query.values[2]).to.equal('John');
				expect(query.values[3]).to.equal('Doe');
			});
		});
	});
});
