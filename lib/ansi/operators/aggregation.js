'use strict';

const helpers = require('../helpers');

module.exports = function(sqlBuilder){
	sqlBuilder.registerHelper('$count', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'COUNT', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$sum', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'SUM', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$min', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'MIN', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$max', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'MAX', aggregation, outerQuery, identifier);
	});

	sqlBuilder.registerHelper('$avg', function(aggregation, outerQuery, identifier){
		return helpers.aggregation.call(this, 'AVG', aggregation, outerQuery, identifier);
	});
};
