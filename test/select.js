"use strict";

var expect     = require("chai").expect;
var SQLBuilder = require('../index');
var sqlbuilder = new SQLBuilder('mysql');

describe("registerHelpers", function() {
    it("check Helper $select", function() {
        expect('$select' in sqlbuilder._helpers).to.equal(true);
    });
});


describe("SELECT Staments", function() {
    describe("Simple", function() {

        it("Only Table", function() {
            var result = sqlbuilder.build({
                $select: {
                    $table: 'people'
                }
            });

            expect(result).to.equal('SELECT * FROM `people`');
        });

        it("Table with columns as array of strings", function() {
            var result = sqlbuilder.build({
                $select: {
                    $columns: ['first_name', 'last_name'],
                    $table: 'people'
                }
            });

            expect(result).to.equal('SELECT `first_name`, `last_name` FROM `people`');
        });

        it("Table with columns as object", function() {
            var result = sqlbuilder.build({
                $select: {
                    $columns: {
                        first_name: {$val: 'John'},
                        last_name: {$val: 'Doe'}
                    },
                    $table: 'people'
                }
            });

            expect(result).to.equal('SELECT ? AS `first_name`, ? AS `last_name` FROM `people`');
        });

    });
});
