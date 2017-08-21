"use strict";

const _ = require('lodash');

const SYNTAX_SELECT = 'SELECT {$sqlFoundRows} {$all} {$distinct} {$columns} FROM {$table}';

module.exports = function(sqlBuilder){
    sqlBuilder.registerHelper('$select', function(query, outerQuery, identifier) {
        var result = '(SELECT ';

        // check the type of the query, it must always be an object
        if (!_.isPlainObject(query)){
            throw new Error('The query helper $select should always be an object.');
        };

        // check for $fields or $columns definition, otherwise we add '*' as columns
        if (!(query.$fields || query.$columns)){
            query.$columns = ['*'];
        }

        result += sqlBuilder.build(query, SYNTAX_SELECT);

        result += ')';
        return result;
    });

    sqlBuilder.registerHelper('$table', function(table, outerQuery, identifier){
        if (_.isString(table)){
            // the table is a string like $table: 'people'
            return ' FROM ' + sqlBuilder.quote(table);
        } else if (_.isPlainObject(table)) {
            // table is an object like $table: { people: { $as: 'alias_people' } }
            return sqlBuilder.build(table);
        } else {
            throw new Error('The $table expression must be a string.');
        }
    });

    sqlBuilder.registerHelper('$columns', function(query, outerQuery, identifier){
        var result = '';

        // the table is a string like $table: 'people'
        if (_.isArray(query)){
            _.forEach(query, function(column){
                // check the type of the column definition
                if (_.isString(column)){
                    result += (result.length > 0 ? ', ' : '') + (column == '*' ? '*' : sqlBuilder.quote(column));
                } else if (_.isPlainObject(column)) {
                    result += (result.length > 0 ? ', ' : '') + sqlBuilder.build(column);
                } else {
                    throw new Error('The items of the $fields array should either be a string or an object.');
                }
            });
        } else if (_.isPlainObject(query)) {
            _.forEach(query, function(value, column){
                // check the type of the column definition
                if (_.isString(value)){
                    sqlBuilder._values.push(value);
                    result += (result.length > 0 ? ', ' : '') + '? AS ' + sqlBuilder.quote(column);
                } else if (_.isPlainObject(value)) {
                    result += (result.length > 0 ? ', ' : '') + sqlBuilder.build(value) + ' AS ' + sqlBuilder.quote(column);
                } else {
                    throw new Error('The items of the $fields array should either be a string or an object.');
                }
            });
        }

        return result;
    });

    sqlBuilder.registerHelper('$val', function(value, outerQuery, identifier){
        sqlBuilder._values.push(value);
        return '?';
    });

};
