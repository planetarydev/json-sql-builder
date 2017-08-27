'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {
	/**
	 * @name $select
	 * @summary Syntax for SELECT Statement using MySQL language dialect.
	 * ```syntax
	 * SELECT [$calcFoundRows] [$distinct] [$all]
	 * 		{ <$columns> [$into] }
	 * 		{ FROM [$table] | [$from] }
	 * 		{ WHERE [$where] }
	 * 		{ GROUP BY [$groupBy]
	 * 			{ WITH ROLLUP [$rollup] }
	 * 			{ HAVING [$having] }
	 * 		}
	 * 		{ ORDER BY { [$sort] | [$orderBy] } }
	 * 		{ LIMIT [$limit] { OFFSET [$offset] } }
	 * ```
	 * @memberOf Query
	 * @isquerying true
	 * @mysql true
	 */
	sqlBuilder.updateSyntax('$select', `SELECT [$calcFoundRows] [$distinct] [$all]
											{ <$columns> [$into] }
											{ FROM [$table] | [$from] }
											{ WHERE [$where] }
											{ GROUP BY [$groupBy]
												{ WITH ROLLUP [$rollup] }
												{ HAVING [$having] }
											}
											{ ORDER BY { [$sort] | [$orderBy] } }
											{ LIMIT [$limit] { OFFSET [$offset] } }`);

	/**
	 * @name $calcFoundRows
	 * @summary Specifies the SQL\_CALC\_FOUND\_ROWS keyword for the SELECT statement using language MySQL
	 *
	 * @memberOf Query.$select
	 * @isquerying true
	 * @mysql true
	 *
	 * @param calcFoundRows	 {Boolean}
	 * Specifies the SQL\_CALC\_FOUND\_ROWS keyword
	 * - `$select: { $calcFoundRows: true, $columns: [ ... ],  ... }`
	 */
	sqlBuilder.registerHelper('$calcFoundRows', function(calcFoundRows/*, outerQuery, identifier*/){
		if (_.isBoolean(calcFoundRows)) {
			return calcFoundRows ? 'SQL_CALC_FOUND_ROWS' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

	/**
	 * @name $into
	 * @summary Specifies the INTO clause for the SELECT statement using language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * INTO [$outfile] [$dumpfile]
	 * ```
	 *
	 * @memberOf Query.$select
	 * @isquerying true
	 * @mysql true
	 *
	 * @param into	 {Array | Object}
	 * Specifies the INTO clause
	 * - into as **Array** like: `$select: { $columns: ['first_name', 'last_name'], $into: ['@firstname', '@lastname'], ... }`
	 * - into as **Object** like: `$select: { $columns: ['first_name', 'last_name'], $into: { $outfile: { ... } }, ... }`
	 *
	 * For further details have a look at the operators
	 * - `$outfile`
	 * - `$dumpfile`
	 *
	 */
	sqlBuilder.registerHelper('$into', function(query/*, outerQuery, identifier*/){
		var result = '',
			results = [];

		// check the type of the query
		if (_.isArray(query)){
			// Array like example
			// $into: ['@firstname', '@lastname']
			_.forEach(query, (column) => {
				// check the type of the column definition, they must all of type String
				if (_.isString(column)){
					results.push(this.quote(column));
				} else {
					throw new Error('The items of the $into array must be type of string.');
				}
			});

			result = (results.length > 0 ? 'INTO ' + results.join(', ') : '');
		} else if (_.isPlainObject(query)) {
			// the query is an object like:
			// $into: {
			// 		$outfile: { $file: '/tmp/people.csv', $terminatedBy: ';' }
			// }
			// let the build-method do this job! --> this will be calling the $outfile helper-function, $file-helper and $terminatedBy-helper
			result = 'INTO ' + this.build(query, null, this.getSyntax('$into'));
		} else {
			throw new Error('$columns must be either array of strings or objects.');
		}

		return result;

	}, 'INTO [$outfile] [$dumpfile]');

	/**
	 * @name $outfile
	 * @summary Specifies the INTO OUTFILE clause for the SELECT statement using language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * INTO OUTFILE <$file> [$fields] [$lines]
	 * ```
	 *
	 * @memberOf Query.$select.$into
	 * @isquerying true
	 * @mysql true
	 *
	 * @param outfile	 {Object}
	 * Specifies the INTO OUTFILE clause
	 * - outfile as **Object** like: `$select: { ... $into: { $outfile: { $file: '/tmp/people.csv', $fields: { $terminatedBy: ';' } } }, ... }`
	 *
	 * For further details have a look at the operators
	 * - `$fields`
	 * - `$lines`
	 */
	sqlBuilder.registerHelper('$outfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$outfile must be an objects.');
		}

		return 'OUTFILE ' + this.build(query, null, this.getSyntax('$outfile'));
	}, 'INTO OUTFILE <$file> [$fields] [$lines]');

	/**
	 * @name $file
	 * @summary Specifies file for the INTO OUTFILE clause using language dialect MySQL.
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param file	 {String}
	 * Specifies the filename for the OUTFILE clause
	 * - outfile as **Object** like: `$select: { ... $into: { $outfile: { $file: '/tmp/people.csv', $fields: { $terminatedBy: ';' } } }, ... }`
	 */
	sqlBuilder.registerHelper('$file', function(file/*, outerQuery, identifier*/){
		if (!_.isString(file)) {
			throw new Error('$file must be a string.');
		}

		return this.addValue(file);
	});

	/**
	 * @name $fields
	 * @summary Specifies the FIELD options for the INTO OUTFILE clause using the SELECT statement with language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * FIELDS [$terminatedBy] [$enclosedBy] [$escapedBy]
	 * ```
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param fields	 {Object}
	 * Specifies FIELD options for INTO OUTFILE clause
	 * - outfile as **Object** like: `$select: { ... $into: { $outfile: { $file: '/tmp/people.csv', $fields: { $terminatedBy: ';' } } }, ... }`
	 */
	sqlBuilder.registerHelper('$fields', function(fields/*, outerQuery, identifier*/){
		if (!_.isObject(fields)) {
			throw new Error('$fields must be an object.');
		}

		return 'FIELDS ' + this.build(fields, null, this.getSyntax('$fields'));
	}, 'FIELDS [$terminatedBy] [$enclosedBy] [$escapedBy]');


	/**
	 * @name $lines
	 * @summary Specifies the LINES options for the INTO OUTFILE clause using the SELECT statement with language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * LINES <$terminatedBy>
	 * ```
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param lines	 {Object}
	 * Specifies LINES options for INTO OUTFILE clause
	 * - lines as **Object** like: `$select: { ... $into: { $outfile: { $file: '/tmp/people.csv', $fields: { $terminatedBy: ';' }, $lines: { $terminatedBy: '\n'} } }, ... }`
	 */
	sqlBuilder.registerHelper('$lines', function(lines/*, outerQuery, identifier*/){
		if (!_.isObject(lines)) {
			throw new Error('$lines must be an object.');
		}

		return 'LINES ' + this.build(lines, null, this.getSyntax('$lines'));
	}, 'LINES <$terminatedBy>');

	/**
	 * @name $terminatedBy
	 * @summary Specifies the `TERMINATED BY` option for the INTO OUTFILE clause. This belongs to both the `$fields` and `$lines` ooperator.
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param terminatedBy	 {String}
	 * Specifies `TERMINATED BY` option for INTO OUTFILE clause
	 * - terminatedBy: `... $fields: { $terminatedBy: ';' }, $lines: { $terminatedBy: '\n'} ...`
	 */
	sqlBuilder.registerHelper('$terminatedBy', function(terminatedBy/*, outerQuery, identifier*/){
		if (!_.isString(terminatedBy)) {
			throw new Error('$terminatedBy must be a string.');
		}

		return 'TERMINATED BY ' + this.addValue(terminatedBy);
	});

	/**
	 * @name $enclosedBy
	 * @summary Specifies the `ENCLOSED BY` option for the INTO OUTFILE clause.
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param enclosedBy	 {String}
	 * Specifies `ENCLOSED BY` option for INTO OUTFILE clause
	 * - enclosedBy: `... $fields: { $terminatedBy: ';', $enclosedBy: '"' }, $lines: { $terminatedBy: '\n'} ...`
	 */
	sqlBuilder.registerHelper('$enclosedBy', function(enclosedBy/*, outerQuery, identifier*/){
		if (!_.isString(enclosedBy)) {
			throw new Error('$enclosedBy must be a string.');
		}

		return 'ENCLOSED BY ' + this.addValue(enclosedBy);
	});

	/**
	 * @name $escapedBy
	 * @summary Specifies the `ESCAPED BY` option for the INTO OUTFILE clause.
	 *
	 * @memberOf Query.$select.$into.$outfile
	 * @isquerying true
	 * @mysql true
	 *
	 * @param escapedBy	 {String}
	 * Specifies `ESCAPED BY` option for INTO OUTFILE clause
	 * - escapedBy: `... $fields: { $terminatedBy: ';', $escapedBy: '\\' }, $lines: { $terminatedBy: '\n'} ...`
	 */
	sqlBuilder.registerHelper('$escapedBy', function(escapedBy/*, outerQuery, identifier*/){
		if (!_.isString(escapedBy)) {
			throw new Error('$escapedBy must be a string.');
		}

		return 'ESCAPED BY ' + this.addValue(escapedBy);
	});

	/**
	 * @name $dumpfile
	 * @summary Specifies the INTO DUMPFILE clause for the SELECT statement using language dialect MySQL.
	 *
	 * **Syntax:**
	 * ```syntax
	 * INTO DUMPFILE <$file>
	 * ```
	 *
	 * @memberOf Query.$select.$into
	 * @isquerying true
	 * @mysql true
	 *
	 * @param dumpfile	 {Object}
	 * Specifies the INTO DUMPFILE clause
	 * - dumpfile as **Object** like: `$select: { ... $into: { $dumpfile: { $file: '/tmp/people.csv' } }, ... }`
	 */
	sqlBuilder.registerHelper('$dumpfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$dumpfile must be an objects.');
		}

		return this.build(query, null, this.getSyntax('$dumpfile'));
	}, 'INTO DUMPFILE <$file>');

	/**
	 * @name $rollup
	 * @summary Specifies the `WITH ROLLUP` option for the `GROUP BY` clause.
	 *
	 * @memberOf Query.$select.$groupBy
	 * @isquerying true
	 * @mysql true
	 *
	 * @param rollup	 {Boolean}
	 * - rollup: `... $groupBy: ['job_titel', 'city'], $rollup: true, ...`
	 */
	sqlBuilder.registerHelper('$rollup', function(rollup/*, outerQuery, identifier*/){
		// $rollup: true,
		if (_.isBoolean(rollup)) {
			return rollup ? 'WITH ROLLUP' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

	/**
	 * @name $limit
	 * @summary Specifies the `LIMIT` option for the `SELECT` Statement.
	 *
	 * @memberOf Query.$select
	 * @isquerying true
	 * @mysql true
	 * @postgres true
	 *
	 * @param limit	 {String | Number}
	 * - limit as **String**: `... $limit: 'ALL', $offset: 0, ...`
	 * - limit as **Number**: `... $limit: 10, $offset: 0, ...`
	 *
	 * For MySQL you an use the keyword `ALL`. Within the query the value would be replaced with `18446744073709551615`.
	 * Further details using `LIMIT ALL` for MySQL see the
	 * official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)
	 */
	sqlBuilder.registerHelper('$limit', function(limit/*, outerQuery, identifier*/){
		const LIMIT_MAX_ALL = 18446744073709551615;

		if (limit === 'ALL') {
			return 'LIMIT ' + this.addValue(LIMIT_MAX_ALL);
		}
		else if (_.isNumber(limit)) {
			return 'LIMIT ' + this.addValue(limit);
		} else {
			throw new Error ('$limit must be \'ALL\' or a number.');
		}
	});

	/**
	 * @name $offset
	 * @summary Specifies the `OFFSET` option for the `SELECT` Statement.
	 *
	 * @memberOf Query.$select
	 * @isquerying true
	 * @mysql true
	 * @postgres true
	 *
	 * @param offset	 {Number}
	 * - offset as **Number**: `... $limit: 10, $offset: 500, ...`
	 *
	 * For MySQL you have to use `OFFSET` option always with `LIMIT`. See the
	 * official docs [https://dev.mysql.com/doc/refman/5.7/en/select.html](https://dev.mysql.com/doc/refman/5.7/en/select.html)
	 */
	sqlBuilder.registerHelper('$offset', function(offset, outerQuery/*, identifier*/){
		// on MySQL we can't use offset without limit
		if ('$limit' in outerQuery) {
			if (_.isNumber(offset)) {
				return 'OFFSET ' + this.addValue(offset);
			} else {
				throw new Error ('$offset must be a number.');
			}
		} else {
			throw new Error ('Can\'t use $offset without $limit.');
		}
	});
};
