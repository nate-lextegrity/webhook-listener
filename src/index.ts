/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */

'use strict';

import { debug as Debug } from 'debug';
import { merge } from 'lodash';
import { createListener } from './core';
import { Config, defaultConfig } from './config';
import { logger as log, setLogger } from './logger';

const debug = Debug('webhook:listener');
let notify;
let config: Config = defaultConfig;

/**
 * Register a function that will get called when webhook is triggered.
 * @public
 * @param {function} consumer Function that will get called when webhook is triggered.
 */
export const register = (consumer: any) => {
  if (typeof consumer !== 'function') {
    throw new Error('Provide function to notify consumer.');
  }
  debug('register called with %O', notify);
  notify = consumer;
  return true;
}

/**
 * Start webhook listener.
 * @public
 * @param {Object} userConfig JSON object that will override default config.
 * @param {Logger} customLogger Instance of a logger that should have info, debug, error, warn method.
 * @returns {Promise} Promise object represents http.Server
 */
export const start = (userConfig: any, customLogger?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      if (customLogger) {
        setLogger(customLogger);
      }
      debug('start called with %O', userConfig);
      setConfig(userConfig);
      validateConfig(config);

      if (!notify) {
        log.error(
          'Aborting start of webhook listener, since no function is provided to notify.',
        );
        return reject(
          new Error(
            `Aborting start of webhook listener, since no function is provided to notify.`,
          ),
        );
      }

      debug('starting with config: ' + JSON.stringify(config));
      const port = process.env.PORT || config.listener.port;
      const server = createListener(config, notify).listen(port, () => {
        log.info(`Server running at port ${port}`);
      });
      return resolve(server);
    } catch (error) {
      return reject(error)
    }
  });
}

/**
 * @public
 * @method setConfig
 * @description
 * Sets listener library's configuration
 * @param {Config} config Listener lib config
 */
export const setConfig = (newConfig) => {
  config = merge(config, newConfig);
}

/**
 * Get configuration.
 */
export const getConfig = () => {
  return config;
}

/**
 * Initialize / reset configuration to defaults.
 */
export const initConfig = () => {
  config = defaultConfig;
}

/**
 * Validates configuration.
 * @param {object} customConfig JSON object that needs to validate.
 */
export const validateConfig = (customConfig: Config) => {
  if (customConfig && customConfig.listener) {
    if (customConfig.listener.endpoint) {
      if (typeof customConfig.listener.endpoint === 'string') {
        const reg = /^\//;
        if (!reg.test(customConfig.listener.endpoint)) {
          customConfig.listener.endpoint = '/' + customConfig.listener.endpoint;
        }
      } else {
        throw new TypeError('Please provide valid listener.endpoint');
      }
    }
    if (
      customConfig.listener.port &&
      typeof customConfig.listener.port !== 'number'
    ) {
      throw new TypeError('Please provide valid listener.port');
    }
  }
}

export { setLogger };
