'use strict';

/**
 * global-item service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::global-item.global-item');
