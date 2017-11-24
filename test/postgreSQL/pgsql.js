'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

// IMPORTANT - create a new instance with parameter "postgreSQL"

describe('postgreSQL Standard', function() {
	describe('Identifier quotation', function() {
		it('should return double-quotes like "table"."column"', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
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
			expect(query.sql).to.equal('SELECT "job_title", SUM("salary") AS "total_salary" FROM "people" GROUP BY "job_title"');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('Placeholder terms', function() {
		it('should return $1, $2, etc. for value placeholders', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
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
			expect(query.sql).to.equal('SELECT * FROM "people" WHERE "first_name" = $1 AND "last_name" = $2');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
		});
	});

	describe('Parameterized queries', function() {
		it('should return escaped values using any $create Operator', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$create: {
					$table: 'users',
					$define: {
						_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
						test: { $column: { $type: 'TEXT', $notNull: true, $default: 'Testvalue' } },
						anyval: { $column: { $type: 'INTEGER', $default: 13 } },

						testCheck: { $constraint: {
							$check: {
								$and: [
									{ test: { $in: ['\';DROP SCHEMA foo;--', 'bar'] } },
									{ anyval: { $gt: 13 } }
								]
							}
						}}
					}
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('CREATE TABLE "users" ("_id" VARCHAR (32) NOT NULL, "test" TEXT NOT NULL DEFAULT \'Testvalue\', "anyval" INTEGER DEFAULT 13, CONSTRAINT "testCheck" CHECK ("test" IN (\'\'\';DROP SCHEMA foo;--\', \'bar\') AND "anyval" > 13))');
			expect(query.values.length).to.equal(0);
		});
	});

	describe('JSON Support', function() {
		it('should return json_agg function aggregation statement', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$select: {
					$from: 'people',
					$columns: {
						user_id: 1,
						tokens: { $json: { $jsonAgg: 'hashed_token' } }
					},
					$groupBy: ['user_id']
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT "user_id", to_json(json_agg("hashed_token")) AS "tokens" FROM "people" GROUP BY "user_id"');
			expect(query.values.length).to.equal(0);
		});

		it('should return row_to_json function statement', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$select: {
					$from: 'people',
					$columns: {
						peopleData: { $rowToJson: 'people' }
			 		}
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT row_to_json("people") AS "peopleData" FROM "people"');
			expect(query.values.length).to.equal(0);
		});

		it('should return json_build_object function with static data', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$select: {
					$from: 'people',
					$columns: {
						peopleData: { $jsonBuildObject: { firstName: 'John', lastName: 'Doe' } }
			 		}
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT json_build_object($1, $2, $3, $4) AS "peopleData" FROM "people"');
			expect(query.values.length).to.equal(4);
			expect(query.values[0]).to.equal('firstName');
			expect(query.values[1]).to.equal('John');
			expect(query.values[2]).to.equal('lastName');
			expect(query.values[3]).to.equal('Doe');
		});

		it('should return json_build_object function with column data', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$select: {
					$from: 'people',
					$columns: {
						peopleData: {
							$jsonBuildObject: {
								firstName: { $column: 'first_name' },
								lastName: { $column: 'last_name' }
							}
						}
			 		}
				}
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('SELECT json_build_object($1, "first_name", $2, "last_name") AS "peopleData" FROM "people"');
			expect(query.values.length).to.equal(2);
			expect(query.values[0]).to.equal('firstName');
			expect(query.values[1]).to.equal('lastName');
		});
	});

	describe('Upsert with using $conflict', function() {
		it('should return INSERT INTO with ON CONFLICT ... DO NOTHING statement', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$insert: {
					$table: 'people',
					$documents: {
						first_name: 'John',
						last_name: 'Doe',
						age: 27
					},
					$conflict: {
						$checkColumns: ['first_name', 'last_name'],
						$doNothing: true,
					}
				},
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('INSERT INTO "people" ("first_name", "last_name", "age") VALUES ($1, $2, $3) ON CONFLICT ("first_name", "last_name") DO NOTHING');
			expect(query.values.length).to.equal(3);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
			expect(query.values[2]).to.equal(27);
		});

		it('should return INSERT INTO with ON CONFLICT ON CONSTRAINT ... DO NOTHING statement', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$insert: {
					$table: 'people',
					$documents: {
						first_name: 'John',
						last_name: 'Doe',
						age: 27
					},
					$conflict: {
						$checkConstraint: 'unique_constraint',
						$doNothing: true,
					}
				},
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('INSERT INTO "people" ("first_name", "last_name", "age") VALUES ($1, $2, $3) ON CONFLICT ON CONSTRAINT "unique_constraint" DO NOTHING');
			expect(query.values.length).to.equal(3);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
			expect(query.values[2]).to.equal(27);
		});

		it('should return INSERT INTO with ON CONFLICT ... DO UPDATE statement', function() {
			var sqlbuilder   = new SQLBuilder('postgreSQL');
			var query = sqlbuilder.build({
				$insert: {
					$table: 'people',
					$documents: {
						first_name: 'John',
						last_name: 'Doe',
						age: 27
					},
					$conflict: {
						$checkColumns: 'last_name',
						$doUpdate: {
							first_name: 'John',
							last_name: 'Doe',
							age: 27
						}
					}
				},
			});

			//expect(query).to.be.instanceOf(SQLQuery);
			expect(query.sql).to.equal('INSERT INTO "people" ("first_name", "last_name", "age") VALUES ($1, $2, $3) ON CONFLICT ("last_name") DO UPDATE SET "first_name" = $4, "last_name" = $5, "age" = $6');
			expect(query.values.length).to.equal(6);
			expect(query.values[0]).to.equal('John');
			expect(query.values[1]).to.equal('Doe');
			expect(query.values[2]).to.equal(27);
			expect(query.values[3]).to.equal('John');
			expect(query.values[4]).to.equal('Doe');
			expect(query.values[5]).to.equal(27);
		});
	});

	it('should return a quick-Test statement', function() {
		var sqlbuilder   = new SQLBuilder('postgreSQL');
		var query = sqlbuilder.build({
			$select: {
				$from: 'people',
				$where: {}
			}
		});

		expect(query.sql).to.equal('SELECT * FROM "people"');
	});

	it('should return SELECT string_agg(...) AS test', function() {
		/*var query = sqlbuilder.build({
			$select: {
				test: { $stringAgg: { $expression: { $column: 'first_name' }, $delimiter: ", " } },
				$from: 'people'
			}
		});
		expect(query.sql).to.equal('SELECT string_agg("first_name", $1) AS "test" FROM "people"');
		expect(query.values.length).to.equal(1);
		expect(query.values[0]).to.equal(", ");*/
	});

});
