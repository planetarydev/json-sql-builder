'use strict';

const _ = require('lodash');


module.exports = function(sqlBuilder){
	/**
	 * @name $as
	 * @memberOf Basics
	 * @isquerying true
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
	 * @isquerying true
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
	 * @isquerying true
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
	 * @isquerying true
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
	 * @name $val
	 * @memberOf Basics
	 * @isquerying true
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
};
