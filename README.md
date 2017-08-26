# json-sql

Writing your SQL-Queries in a way like mongo. Use JSON to define all the queries you like to run.

By default `json-sql` supports the ANSI-SQL language. In addition to this you can specify a dialect like `mysql` or `postgreSQL`.
At this time we will support additional helpers and operators for:
- mysql
- postgreSQL

## Install

```sh
npm install json-sql --save
```

## Getting Started

```javascript
const SQLBuilder = require('json-sql');
// create a new instance of the SQLBuilder and load the language extension for mysql
var sqlbuilder   = new SQLBuilder('mysql');

// lets start some query fun
var totalSalaryQuery = sqlbuilder.build({
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

// the query-object just created can directly used for the NPM mysql package
mysql.query(totalSalaryQuery, function(err, results){
	[ ... ]
});


```

**Result**
```javascript
totalSalaryQuery = {
	sql: 'Your SQL-query-string'
	values: ['Array', 'with', 'all', 'Query-values']
	timeout: 10000 // depends on the options
}

// totalSalaryQuery.sql
SELECT `job_title`, SUM(`salary`) AS `total_salary` FROM `people` WHERE `job_title` IN(?, ?) AND `age` >= ? AND `country_code` = ? GROUP BY `job_title`

// totalSalaryQuery.values
['Sales Manager', 'Account Manager', 18, 'US']
```
