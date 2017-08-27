# json-sql-builder

Writing your SQL-Queries in a way like mongo. Use JSON to define all the queries you like to run.

By default `json-sql-builder` supports the ANSI-SQL language. In addition to this you can specify a dialect like `mysql` or `postgreSQL`.
At this time we will support additional language helpers and operators for:
- [x] MySQL
- [x] PostgreSQL
- [ ] Oracle
- [ ] Microsoft SQL Server

For further details on the language specific helpers and operators have a look at the complete documentation.

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
		$table: 'people',
		$where: {
			job_title: { $in: ['Sales Manager', 'Account Manager'] },
			age: { $gte: 18 },
			country_code: 'US',
		},
		$groupBy: ['job_title'],
	}
});

// the query-result just created can directly passed to the NPM mysql package query-method
// mysql.query(totalSalary, function(err, results){
//	  [ ... ]
// });
```

**Result**
```javascript

totalSalary = {
	sql: 'Your SQL-query-string'
	values: ['Array', 'with', 'all', 'Query-values']
	timeout: 10000 // depends on the options
}

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

```
