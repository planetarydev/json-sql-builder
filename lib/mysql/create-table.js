'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	/**
	 * @name CreateTable
	 * @summary Main operator to generate an `CREATE TABLE` Statement for the `MySQL` language dialect.
	 *
	 * **Syntax**
	 * ```syntax
	 * CREATE { TEMPORARY [$temp] } TABLE { IF NOT EXISTS [$ine] } <$table>  (
	 * 	<$define> (columns, ..., CONSTRAINTS, ...);
	 *
	 * )
	 * { ENGINE [$engine] }
	 * { DEFAULT COLLATE [$collate] }
	 * { TABLESPACE [$tablespace] }
	 * ```
	 * @isddl true
	 * @mysql true
	 *
	 * @param query 	 {Object}		Specifies the details of the $create operator
	 */
	sqlBuilder.updateSyntax('$createTable', `
		CREATE { TEMPORARY [$temp] } TABLE { IF NOT EXISTS [$ine] } <$table>  (
			<$define> (columns, ..., CONSTRAINTS, ...);
		)
		{ AUTO_INCREMENT=[$autoInc] }
		{ ENGINE=[$engine] }
		{ COLLATE=[$collate] }
		{ TABLESPACE=[$tablespace] }
	`);

	/**
	 * @name $column
	 * @summary Main operator to define a column on the `CREATE TABLE` Statement for the `MySQL` language dialect.
	 *
	 * **Syntax**
	 * ```syntax
	 * [$type] [$length]
	 * 	{ NOT NULL [$notNull] }
	 * 	{ DEFAULT [$default] }
	 * 	{ AUTO_INCREMENT [$autoInc] }
	 * 	{ PRIMARY KEY [$primary] }
	 * 	{ UNIQUE [$unique] }
	 * 	{ REFERENCES [$references] }
	 * 	{ COLLATE [$collate] }
	 * ```
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @mysql true
	 *
	 * @param query 	 {Object}		Specifies the details of the $create operator
	 */
	sqlBuilder.updateSyntax('$column', `
		[$type] [$length]
			{ NOT NULL [$notNull] }
			{ DEFAULT [$default] }
			{ AUTO_INCREMENT [$autoInc] }
			{ PRIMARY KEY [$primary] }
			{ UNIQUE [$unique] }
			{ REFERENCES [$references] }
			{ COLLATE [$collate] }
	`);

	/**
	 * @name $autoInc
	 * @summary Specifies the `AUTO_INCREMENT` option of a column or defines the
	 * startvalue for the new table if it is used directly as property of $create.
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @mysql true
	 *
	 * @param value	 {Number | Boolean}
	 * To use it, set the value to `true` or Number for the startvalue.
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$autoInc: 100, // start the AUTO_INCREMENT with 100
	 * 	$define: {
	 * 		id: { $column: { $type: 'INTEGER', $autoInc: true, $primary: true } },
	 * 		...
	 * 	}
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$autoInc', function(query/*, outerQuery, identifier*/) {
		if (_.isBoolean(query)){
			return query ? 'AUTO_INCREMENT' : '';
		} else if (_.isNumber(query)){
			return 'AUTO_INCREMENT=' + query;
		} else {
			throw new Error('$autoInc must be a String.');
		}
	});

	/**
	 * @name $collate
	 * @summary Specifies the `COLLATE` option a column.
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @mysql true
	 *
	 * @param value	 {String}
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		last_name: { $column: { $type: 'TEXT', $collate: 'fr_FR.UTF8' } },
	 * 		...
	 * 	}
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$collate', function(query/*, outerQuery, identifier*/) {
		if (_.isString(query)){
			return 'COLLATE=' + this.quote(query);
		} else {
			throw new Error('$collate must be a String.');
		}
	});

	/**
	 * @name $engine
	 * @summary Specifies the `ENGINE` option for the `CREATE TABLE` statement.
	 *
	 * @memberOf CreateTable
	 * @isddl true
	 * @mysql true
	 *
	 * @param value	 {String}
	 * Specify the Engine as String e.g. 'InnoDb'
	 *
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$engine: 'InnoDb',
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$engine', function(query/*, outerQuery, identifier*/) {
		if (!_.isString(query)){
			throw new Error('$engine must always be a String.');
		}
		return 'ENGINE=' + query;
	});

	/**
	 * @name $tablespace
	 * @summary Specifies the `TABLESPACE` option for the `CREATE TABLE` statement.
	 *
	 * @memberOf CreateTable
	 * @isddl true
	 * @mysql true
	 *
	 * @param value	 {Object}
	 * Specifies the `TABLESPACE` option.
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$tablespace: 'my_table_space'
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$tablespace', function(query/*, outerQuery, identifier*/) {
		if (!_.isString(query)){
			throw new Error('$tablespace must always be a String.');
		}
		return 'TABLESPACE=' + this.quote(query);
	});

};
