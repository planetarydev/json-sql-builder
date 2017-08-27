'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {
	// update the SYNTAX for the ANSI SELECT Statement
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

	sqlBuilder.registerHelper('$calcFoundRows', function(calcFoundRows/*, outerQuery, identifier*/){
		if (_.isBoolean(calcFoundRows)) {
			return calcFoundRows ? 'SQL_CALC_FOUND_ROWS' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

	sqlBuilder.registerSyntax('$into', '[$outfile] [$dumpfile]');

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

	}, '[$outfile] [$dumpfile]');

	sqlBuilder.registerSyntax('$outfile', 'INTO OUTFILE <$file> [$fields] [$lines]');

	sqlBuilder.registerHelper('$outfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$outfile must be an objects.');
		}

		return 'OUTFILE ' + this.build(query, null, this.getSyntax('$outfile'));
	});

	sqlBuilder.registerHelper('$file', function(file/*, outerQuery, identifier*/){
		if (!_.isString(file)) {
			throw new Error('$file must be a string.');
		}

		return this.addValue(file);
	});

	sqlBuilder.registerSyntax('$fields', 'FIELDS [$terminatedBy] [$enclosedBy] [$escapedBy]');

	sqlBuilder.registerHelper('$fields', function(fields/*, outerQuery, identifier*/){
		if (!_.isObject(fields)) {
			throw new Error('$fields must be an object.');
		}

		return 'FIELDS ' + this.build(fields, null, this.getSyntax('$fields'));
	});

	sqlBuilder.registerSyntax('$lines', 'LINES [$terminatedBy]');

	sqlBuilder.registerHelper('$lines', function(lines/*, outerQuery, identifier*/){
		if (!_.isObject(lines)) {
			throw new Error('$lines must be an object.');
		}

		return 'LINES ' + this.build(lines, null, this.getSyntax('$lines'));
	});

	sqlBuilder.registerHelper('$terminatedBy', function(terminatedBy/*, outerQuery, identifier*/){
		if (!_.isString(terminatedBy)) {
			throw new Error('$terminatedBy must be a string.');
		}

		return 'TERMINATED BY ' + this.addValue(terminatedBy);
	});

	sqlBuilder.registerHelper('$enclosedBy', function(enclosedBy/*, outerQuery, identifier*/){
		if (!_.isString(enclosedBy)) {
			throw new Error('$enclosedBy must be a string.');
		}

		return 'ENCLOSED BY ' + this.addValue(enclosedBy);
	});

	sqlBuilder.registerHelper('$escapedBy', function(escapedBy/*, outerQuery, identifier*/){
		if (!_.isString(escapedBy)) {
			throw new Error('$escapedBy must be a string.');
		}

		return 'ESCAPED BY ' + this.addValue(escapedBy);
	});

	sqlBuilder.registerSyntax('$dumpfile', 'INTO DUMPFILE <$file>');

	sqlBuilder.registerHelper('$dumpfile', function(query/*, outerQuery, identifier*/){
		if (!_.isPlainObject(query)) {
			throw new Error('$dumpfile must be an objects.');
		}

		return this.build(query, null, this.getSyntax('$dumpfile'));
	});

	sqlBuilder.registerHelper('$rollup', function(rollup/*, outerQuery, identifier*/){
		// $rollup: true,
		if (_.isBoolean(rollup)) {
			return rollup ? 'WITH ROLLUP' : '';
		} else {
			throw new Error ('$calcFoundRows must be true or false.');
		}
	});

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

	sqlBuilder.registerSyntax('$groupConcat', 'GROUP_CONCAT ( [$distinct] <$column> [$sort] [$orderBy] [$separator] )');

	sqlBuilder.registerHelper('$groupConcat', function(groupConcat, outerQuery, identifier){
		// check for standard group_contact without addinal stuff
		if (_.isString(groupConcat)){
			return helpers.aggregation.call(this, 'GROUP_CONCAT', groupConcat, outerQuery, identifier);
		} else if (_.isPlainObject(groupConcat)) {
			return 'GROUP_CONCAT(' + this.build(groupConcat, identifier, this.getSyntax('$groupConcat')) + ')' + (identifier ? ' AS ' + this.quote(identifier) : '');
		}
	});

	sqlBuilder.registerHelper('$separator', function(separator/*, outerQuery, identifier*/){
		if (!_.isString(separator)) {
			throw new Error ('$separator must be a string.');
		}
		return 'SEPERATOR ' + this.addValue(separator);
	});
};
