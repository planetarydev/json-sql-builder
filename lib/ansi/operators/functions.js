'use strict';

const _ = require('lodash');


module.exports = function(sqlBuilder){
	/**
	 * @name $left
	 * @memberOf String
	 * @isfunction
	 * @mysql true
	 *
	 * @summary Specifies the `LEFT()` function.
	 *
	 * @param {Property} identifier	Specifies original column, table, ... name.
	 * @param {String} alias  		Specifies alias name.
	 */
	sqlBuilder.registerHelper('$left', function(args, outerQuery, identifier){
		if (identifier){
			if (this.isCurrent('$columns')){
				return 'LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ') AS ' + this.quote(identifier);
			} else {
				return this.quote(identifier) + ' = LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ')';
			}
		} else {
			return 'LEFT(' + this.quote(args[0]) + ', ' + this.addValue(args[1]) + ')';
		}
	});

	/**
	 * @name $concat
	 * @memberOf String
	 * @isfunction
	 * @mysql true
	 *
	 * @summary Specifies the `CONCAT()` function.
	 *
	 * @param {Array} params  		Specifies the function parameters.
	 */
	sqlBuilder.registerHelper('$concat', function(args, outerQuery, identifier){
		var results = [];

		_.forEach(args, (arg) => {
			if (_.isPlainObject(arg)) {
				results.push(this.build(arg));
			} else {
				results.push(this.addValue(arg));
			}
		});

		if (identifier){
			if (this.isCurrent('$columns')){
				return 'CONCAT(' + results.join(', ') + ') AS ' + this.quote(identifier);
			} else {
				return this.quote(identifier) + ' = CONCAT(' + results.join(', ') + ')';
			}
		} else {
			return 'CONCAT(' + results.join(', ') + ')';
		}
	});

}
