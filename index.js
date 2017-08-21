"use strict";

const EventEmitter = require('events');

function loadLanguage(language){
    try {
        return require('./lib/helpers-' + language);
    } catch(e) {
        return undefined;
    }
}

const addDefaultHelpers = {
    mysql: loadLanguage('mysql'),
    postgres: loadLanguage('postgres')
}

class _SQLBuilder extends EventEmitter {
    constructor(language) {
        super();

        this._helpers = {};
        this._recursivCounter = 0;
        this._initBuilder();

        addDefaultHelpers[language](this);
    }

    _initBuilder(){
        this._sql = '';
        this._values = [];
        this._helperChain = [];
    }

    build(query, syntax){
        // if the build was started more than one time with different queries
        // we have to reset the _sql, _values and _helperChain
        if (this._recursivCounter == 0) {
            this._initBuilder();
        }
        this._recursivCounter++;

        // check if we have a syntax
        if (syntax){
            var items = syntax.match(/\{\$\w+\}/g);
            items = items.map(function(item){
                return item.replace('{', '').replace('}', '');
            });

            // iterate like the syntax says
            this._sql += items.map((helperName) => {
                // check if the helper is registered and if the query has this property
                if (this._helpers[helperName] && query[helperName]) {
                    return this.helper(helperName, query[helperName], query, helperName /*identifier*/);
                } else {
                    return '';
                }
            }).join('');
        } else {
            // there is no syntax, so we iterate each as it comes
            for (var key in query){
                // check if we know the helper -> each helper starts with $
                if (key.startsWith('$') && this._helpers[key]) {
                    this._sql += this.helper(key, query[key], query, key /*identifier*/);
                }
            }
        }

        this._recursivCounter--;
        if (this._recursivCounter == 0) {
            // we are finished and remove the outer most parentheses
            return this._sql.startsWith('(') ? this._sql.substring(1, this._sql.length - 1) : this._sql;
        }
        return this._sql;
    }

    quote(column, table){
        if (table){
            return '`' + table + '`.`' + column + '`';
        } else {
            return '`' + column + '`';
        }
    }

    helper(name, query, outerQuery, identifier){
        this._helperChain.push(name);
        var result = this._helpers[name].fn(query, outerQuery, identifier);
        this._helperChain.pop();
        return result;
    }

    registerHelper(name, callback){
        this._helpers[name] = {
            fn: callback
        }
    }
}

module.exports = _SQLBuilder;
