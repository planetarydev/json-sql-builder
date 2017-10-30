'use strict';

const _ 		= require('lodash');
const helpers 	= require('../ansi/helpers');

module.exports = function(sqlBuilder) {
	/**
	 * @name Select
	 * @summary Syntax for SELECT Statement using PostgreSQL language dialect.
	 * ```syntax
	 * SELECT [$distinct] [$all]
	 * 		{ <$columns> [$into] }
	 * 		{ FROM [$table] | [$from] }
	 * 		{ WHERE [$where] }
	 * 		{ GROUP BY [$groupBy]
	 * 			{ HAVING [$having] }
	 * 		}
	 * 		{ ORDER BY { [$sort] | [$orderBy] } }
	 * 		{ LIMIT [$limit] { OFFSET [$offset] } }
	 * ```
	 * @isquerying true
	 * @postgres true
	 */
	sqlBuilder.updateSyntax('$select', `SELECT [$calcFoundRows] [$distinct] [$all]
											{ <$columns> [$into] }
											{ FROM [$table] | [$from] }
											{ WHERE [$where] }
											{ GROUP BY [$groupBy]
												{ HAVING [$having] }
											}
											{ ORDER BY { [$sort] | [$orderBy] } }
											{ LIMIT [$limit] { OFFSET [$offset] } }`); // $limit and $offset helpers defined in the ansi module because postgreSQL and MYSQL use the same syntax
};
