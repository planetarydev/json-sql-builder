'use strict';

const _ 		= require('lodash');

module.exports = function(sqlBuilder){
	// ANSI CREATE VIEW Statement Syntax
	sqlBuilder.registerSyntax('$createView', `
		CREATE { OR REPLACE [$cor] } VIEW <$view> AS
			SELECT <$select>
	`);

	/**
	 * @before
	 *
	 * # CREATE VIEW Statements
	 *
	 * To create a new View in the database you have to use the `$create` together with the `$view` operator.
	 * Check the Syntax and Examples.
	 *
	 * **Example**
	 * ```javascript
	 * $create: {
	 * 	$view: { $cor: 'v_people' },  // $cor = CREATE OR REPLACE
	 * 	$select: {
	 * 		$from: 'people',
	 * 		$columns: [
	 * 			'last_name',
	 * 			'first_name'
	 * 		]
	 * 	}
	 * }
	 *
	 * // Output
	 * CREATE OR REPLACE VIEW `v_people` AS
	 * 	SELECT
	 * 		`first_name`,
	 * 		`last_name`
	 * 	FROM
	 * 		`people`;
	 * ```
	 *
	 * @name CreateView
	 * @summary Main operator to generate an `CREATE VIEW` Statement
	 *
	 * **Syntax**
	 * ```syntax
	 * CREATE { OR REPLACE [$cor] } VIEW <$view> AS
	 * 	SELECT <$select>
	 * ```
	 * @isddl true
	 * @ansi true
	 *
	 * @param query 	 {Object}		Specifies the details of the $create operator
	 */
	//sqlBuilder.registerHelper('$create', function(query/*, outerQuery, identifier*/) {
	// XXX this Operator is located at "ansi/create-table.js"
	//});

	/**
	 * @name $view
	 * @summary Specifies the name of the View for the `CREATE VIEW` Statement
	 *
	 * @memberOf CreateView
	 * @isddl true
	 * @ansi true
	 *
	 * @param view	 {String}
	 * Specifies the Name of the View.
	 */
	sqlBuilder.registerHelper('$view', function(view, outerQuery, identifier){
		if (_.isString(view)){
			if (this.mainOperator == '$createView') {
				return 'VIEW ' + this.quote(view) + ' AS';
			}
			// the view is a string like $view: 'v_people'
			return this.quote(view);
		} else if (_.isPlainObject(view)) {
			// view is an object like $create: { $view: { $cor: 'v_people' } }
			if (this.mainOperator == '$createView') {
				if ('$cor' in view) {
					if (_.isString(view['$cor'])) {
						return 'OR REPLACE VIEW ' + this.quote(view['$cor']) + ' AS';
					} else {
						throw new Error('$cor must always be a string representing the name of the view.');
					}
				}
				return 'VIEW ' + this.build(view) + ' AS';
			}
			return this.build(view);
		} else {
			throw new Error('$view must either be a string or object.');
		}
	});
};
