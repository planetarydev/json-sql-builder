# json-sql-builder

Writing your SQL-Queries in a way like mongo. Use JSON to define all the queries you like to run.

By default `json-sql-builder` supports the ANSI-SQL language. In addition to this you can specify a dialect like `mysql` or `postgreSQL`.
At this time we will support additional language helpers and operators for:
- [x] ANSI
- [x] MySQL
- [x] PostgreSQL
- [ ] Oracle
- [ ] Microsoft SQL Server

For further details on the language specific helpers and operators have a look at the complete
documentation at [https://planetarydev.github.io/json-sql-builder/](https://planetarydev.github.io/json-sql-builder/).

## Current Dev Stage

The developing of this module is currently still in work, for details have a look at the [roadmap](https://planetarydev.github.io/json-sql-builder/roadmap.html). If you like to support the current development feel free and contribute on github. Any pull requests are welcome if you supply:
- Tests
- Documentation
- Support backward compatibility


## Install

```sh
npm install json-sql-builder --save
```

## Getting Started

```javascript
const SQLBuilder = require('json-sql-builder');
// create a new instance of the SQLBuilder and load the language extension for mysql
var sqlbuilder   = new SQLBuilder('mysql');

// lets start some query fun
var totalSalary = sqlbuilder.build({
	$select: {
		$columns: [
			'job_title',
			{ total_salary: { $sum: 'salary' } }
		],
		$from: 'people',
		$where: {
			job_title: { $in: ['Sales Manager', 'Account Manager'] },
			age: { $gte: 18 },
			country_code: 'US',
		},
		$groupBy: ['job_title'],
	}
});

```

**Result**
```javascript
// totalSalary.sql
SELECT
	`job_title`,
	SUM(`salary`) AS `total_salary`
FROM
	`people`
WHERE
	`job_title` IN (?, ?)
AND `age` >= ?
AND `country_code` = ?
GROUP BY
	`job_title`

// totalSalary.values
['Sales Manager', 'Account Manager', 18, 'US']


// general output
queryOutput = {
	sql: 'Your SQL-query-string'
	values: ['Array', 'with', 'all', 'Query-values']
	timeout: 10000 // depends on the options
}

```

----------------------------------------------------------------------------------

# Release notes

### 1.0.14 Add `CREATE INDEX` operators and helpers for
- ANSI using `$create: { $index: 'myidx', $table: 'mytable', $columns: {...} }`
- Move `$ine` to Basic Helpers and support Boolean and String expressions
- Update tests and docs

```javascript
var query = sqlbuilder.build({
	$create: {
		$index: 'idx_people_last_name',
		$table: 'people',
		$columns: {
			last_name: { $asc: true },
			first_name: { $asc: true },
		},
		$using: 'BTREE'
	}
}

// OUTPUT
CREATE INDEX `idx_people_last_name` ON `people` USING BTREE (
	`last_name` ASC,
	`first_name` ASC
);
```

### 1.0.13 Add `CREATE TABLE` operators and helpers for
- ANSI
- PostgreSQL
- MySQL
- Update tests and docs

```javascript
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

// OUTPUT
CREATE TABLE `users` (
	`_id` VARCHAR (32) NOT NULL,
	`username` TEXT,
	`first_name` TEXT,
	`last_name` TEXT DEFAULT ?,
	`createdAt` DATETIME NOT NULL,

	CONSTRAINT `pk_users` PRIMARY KEY (`_id`),
	CONSTRAINT `uc_users_username` UNIQUE (`username`)
);
```

### 1.0.12 Add helpers and operators for **postgreSQL**
- `LIMIT` and `LIMIT ALL` using `$limit`
- `OFFSET` using `$offset`
- add `sqlDialect` property to sqlBuilder to use it inside of helper-functions

### 1.0.11 Add helpers and operators for **postgreSQL**
- `ON CONFLICT` clause using `$confict`
- Update documetation

### 1.0.10 Add helpers and operators for **postgreSQL**
- Function `json_agg()` using `$jsonAgg`
- Function `to_json()` using `$json`
