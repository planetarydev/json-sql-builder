'use strict';

const expect     = require('chai').expect;
const SQLBuilder = require('../../index');
const SQLQuery   = require('../../lib/sqlquery');

var sqlbuilder   = new SQLBuilder();

describe('ANSI Query Operators', function() {
	describe('$joins: { ... }', function() {

		describe('Join Tables and Views', function() {
			it('should return SELECT ... LEFT JOIN', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'public.users', $joins: {
							'public.users_profiles': { $leftJoin: { 'public.users.id': { $eq: { $column: 'public.users_profiles.user_id' } } } }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `public`.`users` LEFT JOIN `public`.`users_profiles` ON `public`.`users`.`id` = `public`.`users_profiles`.`user_id`');
				expect(query.values.length).to.equal(0);
			});

			it('should return SELECT ... LEFT JOIN <table> AS <alias>', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'public.users', $joins: {
							'public.users_profiles': { $as: 'profile', $leftJoin: { 'public.users.id': { $eq: { $column: 'profile.user_id' } } } }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `public`.`users` LEFT JOIN `public`.`users_profiles` AS `profile` ON `public`.`users`.`id` = `profile`.`user_id`');
				expect(query.values.length).to.equal(0);
			});

			it('should return SELECT ... INNER JOIN <table> AS <alias>', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'public.users', $joins: {
							'public.users_profiles': { $as: 'profile', $innerJoin: { 'public.users.id': { $eq: { $column: 'profile.user_id' } } } }
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `public`.`users` INNER JOIN `public`.`users_profiles` AS `profile` ON `public`.`users`.`id` = `profile`.`user_id`');
				expect(query.values.length).to.equal(0);
			});

			it('should return SELECT ... INNER JOIN <table> AS <alias> LEFT JOIN <table>', function() {
				var query = sqlbuilder.build({
					$select: {
						$from: 'public.users',
						$joins: {
							'public.users_profiles': { $as: 'profile', $innerJoin: { 'public.users.id': { $eq: { $column: 'profile.user_id' } } } },
							'public.users_likes': { $as: 'likes',
								$leftJoin: {
									$and: [
										{ 'likes.user_id': { $eq: '~~public.users.id' } },
										{ 'likes.score': { $gt: 1 } }
									]
								}
							}
						}
					}
				});

				//expect(query).to.be.instanceOf(SQLQuery);
				expect(query.sql).to.equal('SELECT * FROM `public`.`users` INNER JOIN `public`.`users_profiles` AS `profile` ON `public`.`users`.`id` = `profile`.`user_id` LEFT JOIN `public`.`users_likes` AS `likes` ON `likes`.`user_id` = `public`.`users`.`id` AND `likes`.`score` > ?');
				expect(query.values.length).to.equal(1);
				expect(query.values[0]).to.equal(1);
			});
		});

	});
});
