## limit Helper

Specifies the `LIMIT` clause for the `SELECT` Statement.

### Definition

- As *Number* : `< value >`
- As *String*, allowed Values:
  - ALL `< value >`

### Supported by

- [MySQL](https://dev.mysql.com/doc/refman/5.5/en/select.html#idm140536593160960)
- [MariaDB](https://mariadb.com/kb/en/library/limit/)
- [PostgreSQL](https://www.postgresql.org/docs/9.5/static/sql-select.html#SQL-LIMIT)
- [SQLite](https://sqlite.org/lang_select.html#limitoffset)


### Examples - As *Number*

**Basic Usage**

```javascript
function() {
	let query = sql.build({
		$select: {
			$from: 'people',
			$limit: 10
		}
	});

	return query;
}

// SQL - result
SELECT * FROM people LIMIT $1;

// Values
values: {
	$1: 10
}
```

### Examples - As `String` with value `ALL`

**MySQL turns `{ $limit: 'ALL' }` to `LIMIT 9007199254740991`**


**Note** This Example is only valid for
- MySQL
- MariaDB


```javascript
function(){
	let query = sql.build({
		$select: {
			$from: 'people',
			$limit: 'ALL'
		}
	});
	return query;
}

// SQL - Result
SELECT * FROM people LIMIT 9007199254740991

// Values
values: {

}
```
