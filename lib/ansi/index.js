'use strict';

module.exports = function(sqlBuilder){
	require('./operators/basic')(sqlBuilder);
	require('./operators/logical')(sqlBuilder);
	require('./operators/aggregation')(sqlBuilder);
	require('./operators/comparison')(sqlBuilder);
	require('./select')(sqlBuilder);
};
