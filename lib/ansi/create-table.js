'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI CREATE TABLE Statement Syntax
	sqlBuilder.registerSyntax('$createTable', `
		CREATE { TEMPORARY [$temp] } TABLE { IF NOT EXISTS [$ine] } <$table>
			<$define> (columns, ..., CONSTRAINTS, ...);
	`);

	sqlBuilder.registerSyntax('$column', `
		[$type] [$length]
			{ NOT NULL [$notNull] }
			{ DEFAULT [$default] }
			{ PRIMARY KEY [$primary] }
			{ UNIQUE [$unique] }
			{ CHECK [$check] }
			{ REFERENCES [$references] }
	`);

	sqlBuilder.registerSyntax('$constraint', `
		CONSTRAINT
			{ PRIMARY KEY [$primary] }
			{ UNIQUE [$unique] }
			{ FOREIGN KEY [$foreignKey] }
			{ CHECK [$check] }
			[$columns]
			[$references]
	`);

	sqlBuilder.registerSyntax('$references', `
		REFERENCES <$table> ( <$columns> )
			{ ON DELETE [$onDelete] }
			{ ON UPDATE [$onUpdate] }
	`);

	/**
	 * @before
	 *
	 * # CREATE TABLE Statements
	 *
	 * To create a new Table in the database you have to use the `$create` operator.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
	 * 		first_name: { $column: { $type: 'VARCHAR', $length: 50 } },
	 * 		last_name: { $column: { $type: 'VARCHAR', $length: 50 } },
	 * 		age: { $column: { $type: 'INTEGER' } },
	 *
	 * 		pk_people: { $constraint: { $primary: true, $columns: '_id' } }
	 * 	}
	 * }
	 * ```
	 *
	 * @name CreateTable
	 * @summary Main operator to generate an `CREATE TABLE` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * CREATE { TEMPORARY [$temp] } TABLE { IF NOT EXISTS [$ine] } <$table>
	 * 	<$define> (columns, ..., CONSTRAINTS, ...);
	 * ```
	 * @isddl true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details of the $create operator
	 */
	sqlBuilder.registerHelper('$create', function(query/*, outerQuery, identifier*/) {
		var syntaxName;

		if (!_.isPlainObject(query)){
			throw new Error('$create must always be an object.');
		}

		// setup the main Operator and the Syntax
		if ('$table' in query && !('$index' in query)) {
			this.mainOperator = '$createTable';
			syntaxName = '$createTable';
		} else if ('$index' in query && '$table' in query) {
			this.mainOperator = '$createIndex';
			syntaxName = '$createIndex';
		} else if ('$tablespace' in query && !('$table' in query)) {
			this.mainOperator = '$createTablespace';
			syntaxName = '$createTablespace';
		}

		// perform the insert with the given syntax
		return 'CREATE ' + this.build(query, null, this.getSyntax(syntaxName));
	});

	/**
	 * @name $define
	 * @summary Specifies the columns and constraints for the `CREATE TABLE` Statement
	 *
	 * @memberOf CreateTable
	 * @isddl true
	 * @ansi true
	 *
	 * @param columnDef	 {Object}
	 * Specifies the columns and constraints as Object for the `CREATE TABLE` Statement
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		people_id: { $column: { $type: 'INTEGER', $notNull: true } },
	 * 		first_name: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
	 * 		last_name: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
	 *
	 * 		pk_people: { $constraint: { $primary: true, $columns: '_id' } }
	 * 	}
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$define', function(query, outerQuery, identifier){
		var results = [];

		if (_.isPlainObject(query)) {
			_.forEach(query, (value, column) => {
				if (_.isPlainObject(value)) {
					//console.log(value, column);
					results.push(/*this.quote(column) + ' ' + */this.build(value, column));
				} else {
					throw new Error('The items of $define must be an object.');
				}
			});
		} else {
			throw new Error('$define must be an Object.');
		}

		return '(' + results.join(', ') + ')';
	});

	/**
	 * @name $temp
	 * @summary Specifies the `TEMPORARY` option for the `CREATE TABLE` statement.
	 *
	 * @memberOf CreateTable
	 * @isddl true
	 * @ansi true
	 *
	 * @param value	 {Boolean}
	 * If the value is set to `true` the `TEMPORARY` option will be used.
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$temp: true,
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$temp', function(query/*, outerQuery, identifier*/) {
		if (!_.isBoolean(query)){
			throw new Error('$temp must always be a Boolean.');
		}
		return query ? 'TEMPORARY' : '';
	});

	/**
	 * @name $ine
	 * @summary Specifies the `IF NOT EXISTS` keyword, option
	 *
	 * @memberOf Basics
	 * @ishelper true
	 * @isddl true
	 * @ansi true
	 *
	 * @param value	 {Boolean}
	 * If the value is set to `true` the `IF NOT EXISTS` clause will be used.
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: { $ine: 'people' },
	 * 	// or instead used as boolean expr.
	 * 	$ine: true,
	 * 	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$ine', function(query/*, outerQuery, identifier*/) {
		// example:
		// $table: { $ine: 'tablename' }  ==> TABLE IF NOT EXISTS `tablename`
		// $index: { $ine: 'idxname' }  ==> INDEX IF NOT EXISTS `idxname`
		if (!_.isBoolean(query) && !_.isString(query)){
			throw new Error('$ine must either be a Boolean or String.');
		}

		if (_.isBoolean(query)) {
			return 'IF NOT EXISTS';
		}
		return 'IF NOT EXISTS ' + this.quote(query);
	});

	/**
	 * @name $column
	 * @summary Specifies a Column
	 *
	 * **Syntax**
	 * ```syntax
	 * [$type] [$length]
	 * 	{ NOT NULL [$notNull] }
	 * 	{ DEFAULT [$default] }
	 * 	{ PRIMARY KEY [$primary] }
	 * 	{ UNIQUE [$unique] }
	 * 	{ CHECK [$check] }
	 * 	{ REFERENCES [$references] }
	 * ```
	 * @memberOf CreateTable.$define
	 * @isddl true
	 * @ansi true
	 *
	 * @param column	 {String}
	 * Specifies a Column.
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		_id: { $column: { $type: 'VARCHAR', $length: 32, $notNull: true } },
	 * 		first_name: { $column: { $type: 'VARCHAR', $length: 50 } },
	 * 		last_name: { $column: { $type: 'VARCHAR', $length: 50 } },
	 * 		age: { $column: { $type: 'INTEGER' } }
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$column', function(column, outerQuery, identifier) {
		// use $column as String, will only return the quoted column-name
		if (_.isString(column)){
			return this.quote(column)
		}

		if (!_.isPlainObject(column)){
			throw new Error('$column must always be an Object.');
		}
		return this.quote(identifier) + ' ' + this.build(column, null, this.getSyntax('$column'));
	});


	/**
	 * @name $type
	 * @summary Specifies the Column-Type of a new column to create with `$create`
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @ansi true
	 *
	 * @param type	 {String}
	 * Specifies the datatype of a Column.
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		_id: { $type: 'VARCHAR', $length: 32, $notNull: true },
	 * 		first_name: { $type: 'VARCHAR', $length: 50 },
	 * 		last_name: { $type: 'VARCHAR', $length: 50 },
	 * 		age: { $type: 'INTEGER' }
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$type', function(query/*, outerQuery, identifier*/) {
		if (!_.isString(query)){
			throw new Error('$type must always be a String.');
		}
		return query;
	});

	/**
	 * @name $length
	 * @summary Specifies the length of Column-Type
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @ansi true
	 *
	 * @param type	 {String}
	 * Specifies the length of a Datatype used by $create->$define->$column->$type
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		// creates a VARCHAR(50) column
	 * 		last_name: { $type: 'VARCHAR', $length: 50 },
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$length', function(query/*, outerQuery, identifier*/) {
		if (!_.isNumber(query)){
			throw new Error('$length must always be a Number.');
		}
		return '(' + query + ')';
	});

	/**
	 * @name $notNull
	 * @summary Specifies the `NOT NULL` option of a Column on the $create
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @ansi true
	 *
	 * @param notNull	 {Boolean}
	 * Specifies the `NOT NULL` option of a Column on the $create->$define.$column
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		// creates a VARCHAR(50) column NOT NULL
	 * 		last_name: { $type: 'VARCHAR', $length: 50, $notNull: true },
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$notNull', function(query/*, outerQuery, identifier*/) {
		if (!_.isBoolean(query)){
			throw new Error('$notNull must always be a Boolean.');
		}
		return query ? 'NOT NULL' : '';
	});

	/**
	 * @name $default
	 * @summary Specifies the `DEFAULT` option of a Column on the $create
	 *
	 * @memberOf CreateTable.$define.$column
	 * @isddl true
	 * @ansi true
	 *
	 * @param default	 {Number | String}
	 * Specifies the `DEFAULT` option of a Column on the $create->$define.$column
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		// creates a VARCHAR(50) column NOT NULL DEFAULT 'John'
	 * 		last_name: { $column: { $type: 'VARCHAR', $length: 50, $notNull: true, $default: 'John' } },
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$default', function(query/*, outerQuery, identifier*/) {
		if (!_.isNumber(query) && !_.isString(query)){
			throw new Error('$default must be type of Number or String.');
		}
		return 'DEFAULT ' + this.addValue(query);
	});

	/**
	 * @name $constraint
	 * @summary Specifies a `CONSTRAINT` for the `CREATE TABLE` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * CONSTRAINT
	 * 	{ PRIMARY KEY [$primary] }
	 * 	{ UNIQUE [$unique] }
	 * 	{ FOREIGN KEY [$foreignKey] }
	 * 	{ CHECK [$check] }
	 * 	[$columns]
	 * ```
	 * @memberOf CreateTable.$define
	 * @isddl true
	 * @ansi true
	 *
	 * @param constraint	 {Object}
	 * Specifies a constraint as Object for the `CREATE TABLE` Statement
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		... // columns
	 *
	 * 		pk_people: { $constraint: { $primary: true, $columns: '_id' } },
	 * 		uc_people_name: { $constraint: { $unique: true, $columns: ['first_name', 'last_name'] } }
	 * 	}
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$constraint', function(query, outerQuery, identifier){
		if (!_.isPlainObject(query)){
			throw new Error('$constraint must always be an Object.');
		}

		// keep te current mainOperator in mind
		var oldMainOperator = this.mainOperator;
		// setup the mainOperator for the $columns helper to get all columns closed by round brackets like "(" <column-list> ")"
		this.mainOperator = '$constraint';
		var result = 'CONSTRAINT ' + this.quote(identifier) + ' ' + this.build(query, null, this.getSyntax('$constraint'));

		// restore the mainOperator to the original / old value
		this.mainOperator = oldMainOperator;
		return result;
	});

	/**
	 * @name $primary
	 * @summary Specifies the `PRIMARY KEY` option of a `CONSTRAINT` Statement
	 *
	 * @memberOf CreateTable.$define.$constraint
	 * @isddl true
	 * @ansi true
	 *
	 * @param primary	 {Boolean}
	 * Specifies the `PRIMARY KEY` option of a Constraint on the $create->$define...$constraint
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	$define: {
	 * 		...
	 * 		// creates CONSTRAINT `pk_people` PRIMARY KEY(_id)
	 * 		pk_people: { $constraint: { $primary: true, $columns: '_id' } },
	 * 		...
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$primary', function(query/*, outerQuery, identifier*/) {
		if (!_.isBoolean(query)){
			throw new Error('$primary must always be a Boolean.');
		}
		return query ? 'PRIMARY KEY' : '';
	});

	/**
	 * @name $unique
	 * @summary Specifies the `UNIQUE KEY` option of a `CONSTRAINT` Statement
	 *
	 * @memberOf CreateTable.$define.$constraint
	 * @isddl true
	 * @ansi true
	 *
	 * @param unique	 {Boolean}
	 * Specifies the `UNIQUE` option of a Constraint on the $create->$define...$constraint
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	...
	 * 	$define: {
	 * 		// creates CONSTRAINT `uk_people` UNIQUE KEY(`first_name`, `last_name`)
	 * 		uk_people: { $constraint: { $unique: true, $columns: ['first_name', 'last_name'] } },
	 * 	}
	 *	...
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$unique', function(query/*, outerQuery, identifier*/) {
		if (!_.isBoolean(query)){
			throw new Error('$unique must always be a Boolean.');
		}
		return query ? 'UNIQUE' : '';
	});

	/**
	 * @name $foreignKey
	 * @summary Specifies the `FOREIGN KEY` option of a `CONSTRAINT` Statement.
	 * Using `$foreignKey: true` the `$references` helper will be mandatory.
	 *
	 * @memberOf CreateTable.$define.$constraint
	 * @isddl true
	 * @ansi true
	 *
	 * @param foreignKey	 {Boolean}
	 * Specifies the `FOREIGN KEY` option of a Constraint on the $create->$define...$constraint
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	...
	 * 	$define: {
	 * 		fk_users: {
	 * 			$constraint: {
	 * 				$foreignKey: true,
	 * 				$columns: '_id',
	 * 				$references: {
	 * 					$table: 'user_emails',
	 * 					$columns: 'user_id',
	 * 					$onDelete: 'CASCADE',
	 * 					$onUpdate: 'RESTRICT'
	 * 				}
	 * 			},
	 * 		}
	 *		...
	 * 	}
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$foreignKey', function(query/*, outerQuery, identifier*/) {
		if (!_.isBoolean(query)){
			throw new Error('$foreignKey must always be a Boolean.');
		}
		return query ? 'FOREIGN KEY' : '';
	});

	/**
	 * @name $references
	 * @summary Specifies the `REFERENCES` clause on the `FOREIGN KEY CONSTRAINT` Statement.
	 *
	 * **Syntax**
	 * ```syntax
	 * REFERENCES <$table> ( <$columns> )
	 * 	{ ON DELETE [$onDelete] }
	 * 	{ ON UPDATE [$onUpdate] }
	 * ```
	 * @memberOf CreateTable.$define.$constraint.$foreignKey
	 * @isddl true
	 * @ansi true
	 *
	 * @param references	 {Object}
	 * Specifies the `REFERENCES` clause. Example see [$foreignKey](DDL-Create.html#Create-define-constraint)
	 */
	sqlBuilder.registerHelper('$references', function(query, outerQuery, identifier) {
		if (!_.isObject(query)){
			throw new Error('$references must always be an Object.');
		}
		return 'REFERENCES ' + this.build(query, null, this.getSyntax('$references'));
	});

	/**
	 * @name $onDelete
	 * @summary Specifies the `ON DELETE` option for the `REFERENCES` clause using the `FOREIGN KEY CONSTRAINT`.
	 *
	 * @memberOf CreateTable.$define.$constraint.$foreignKey.$references
	 * @isddl true
	 * @ansi true
	 *
	 * @param onDelete	 {String}
	 * Take one of the follwowing options:
	 * - CASCADE
	 * - RESTRICT
	 * - SET NULL
	 * - SET DEFAULT
	 * - NO ACTION
	 */
	sqlBuilder.registerHelper('$onDelete', function(query, outerQuery, identifier) {
		if (!_.isString(query)){
			throw new Error('$onDelete must always be a String.');
		}
		return 'ON DELETE ' + query;
	});

	/**
	 * @name $onUpdate
	 * @summary Specifies the `ON UPDATE` option for the `REFERENCES` clause using the `FOREIGN KEY CONSTRAINT`.
	 *
	 * @memberOf CreateTable.$define.$constraint.$foreignKey.$references
	 * @isddl true
	 * @ansi true
	 *
	 * @param onUpdate	 {String}
	 * Specifies on of the follwowing options:
	 * - CASCADE
	 * - RESTRICT
	 * - SET NULL
	 * - SET DEFAULT
	 * - NO ACTION
	 */
	sqlBuilder.registerHelper('$onUpdate', function(query, outerQuery, identifier) {
		if (!_.isString(query)){
			throw new Error('$onUpdate must always be a String.');
		}
		return 'ON UPDATE ' + query;
	});

	/**
	 * @name $check
	 * @summary Specifies the expression of a `CHECK CONSTRAINT` Statement.
	 *
	 * @memberOf CreateTable.$define.$constraint
	 * @isddl true
	 * @ansi true
	 *
	 * @param check	 {Object}
	 * Specifies the expression / condition to check
	 *
	 * **Example**
	 *
	 * ```javascript
	 * $create: {
	 * 	$table: 'people',
	 * 	...
	 * 	$define: {
	 * 		$constraint: {
	 * 			check_people_age: {
	 * 				$check: {
	 * 					age: { $gte: 18 }
	 * 				}
	 * 			}
	 * 		}
	 *		...
	 * 	}
	 * }
	 * ```
	 */
	sqlBuilder.registerHelper('$check', function(query/*, outerQuery, identifier*/) {
		if (!_.isPlainObject(query)){
			throw new Error('$check must always be an Object.');
		}

		var checkExpr = this.build(query);
		if (! checkExpr.startsWith('(')){
			checkExpr = '(' + checkExpr + ')';
		}

		return 'CHECK ' + checkExpr;
	});
};
