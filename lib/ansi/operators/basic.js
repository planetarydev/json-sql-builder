'use strict';

const _ = require('lodash');


module.exports = function(sqlBuilder){
	/**
	 * @name $as
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies an alias for a column, table or any other expression.
	 *
	 * @param {Property} identifier	Specifies original column, table, ... name.
	 * @param {String} alias  		Specifies alias name.
	 */
	sqlBuilder.registerHelper('$as', function(alias, outerQuery, identifier){
		if (identifier){
			return this.quote(identifier) + ' AS ' + this.quote(alias);
		} else {
			return 'AS ' + this.quote(alias);
		}
	});

	/**
	 * @name $alias
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies an alias for a column, table or any other expression.
	 *
	 * @param {Property} identifier	Specifies original column, table, ... name.
	 * @param {String} alias  		Specifies alias name.
	 */
	sqlBuilder.registerHelper('$alias', function(alias, outerQuery, identifier){
		// only an alias for $as :-)
		return this.callHelper('$as', alias, outerQuery, identifier);
	});

	/**
	 * @name $expr
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies an expression
	 *
	 * @param {Object} expr	Specifies the expression as Object.
	 */
	sqlBuilder.registerHelper('$expr', function(expr/*, outerQuery, identifier*/){
		return this.build(expr);
	});

	/**
	 * @name $column
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies a single column.
	 *
	 * @param {String} column	Specifies the column-identifier.
	 */
	sqlBuilder.registerHelper('$column', function(column/*, outerQuery, identifier*/){
		if (_.isString(column)){
			return this.quote(column);
		} else {
			throw new Error ('$column must be a string.');
		}
	});

	/**
	 * @name $table
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies a table identifier.
	 *
	 * @param {String | Object} table
	 * Specifies a table-identifier
	 * - value is a **String** like: `$table: 'people'`
	 * - value is an **Object** like: `$table: { people: { $as: 'alias_people' } }`
	 */
	sqlBuilder.registerHelper('$table', function(table/*, outerQuery, identifier*/){
		if (_.isString(table)){
			// the table is a string like $table: 'people'
			return this.quote(table);
		} else if (_.isPlainObject(table)) {
			// table is an object like $table: { people: { $as: 'alias_people' } }
			return this.build(table);
		} else {
			throw new Error('$table expression must be either a string or object.');
		}
	});

	/**
	 * @name $val
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies a fixed value.
	 *
	 * @param {Property} identifier	Specifies the identifier
	 * @param {Primitive} val	Specifies the value
	 */
	sqlBuilder.registerHelper('$val', function(val, outerQuery, identifier){
		if (identifier) {
			return this.addValue(val) + ' AS ' + this.quote(identifier);
		} else {
			return this.addValue(val);
		}
	});

	/**
	 * @name $inc
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies an increment operator for a column.
	 *
	 * @param {Property} identifier	Specifies the column-identifier.
	 * @param {Number} value  		Specifies the increment as Number.
	 */
	sqlBuilder.registerHelper('$inc', function(value, outerQuery, identifier){
		if (identifier){
			return this.quote(identifier) + ' + ' + this.addValue(value);
		} else {
			return '+ ' + this.addValue(value);
		}
	});

	/**
	 * @name $dec
	 * @memberOf Basics
	 * @ishelper true
	 * @ansi true
	 *
	 * @summary Specifies a decrement operator for a column.
	 *
	 * @param {Property} identifier	Specifies the column-identifier.
	 * @param {Number} value  		Specifies the decrement as Number.
	 */
	sqlBuilder.registerHelper('$dec', function(value, outerQuery, identifier){
		if (identifier){
			return this.quote(identifier) + ' - ' + this.addValue(value);
		} else {
			return '- ' + this.addValue(value);
		}
	});

};
