/* global describe, it */

'use strict';

//var _ = require('lodash-compat');
var expect = require('expect');
var SwaggerClient = require('..');

require('./mock');

describe('client macros', function () {
    it('tests the parameter macro per #612', function(done) {
        var macros = {
            parameter: function (operation, parameter) {
                if (parameter.name === 'petId') {
                    return '100';
                }
                return parameter.default;
            },
            modelProperty: function (property) {
                return property.default;
            }
        };

        new SwaggerClient({
            url: 'http://petstore.swagger.io/v2/swagger.json',
            usePromise: true,
            parameterMacro: macros.parameter
        }).then(function (client) {
            var parameters = client.pet.apis.getPetById.parameters;
            expect(parameters[0].default).toBe('100');
            done();
        }).catch(function (exception) {
            done(exception);
        });
    });
});
