global.fetch = require('jest-fetch-mock');
global.App = function() {}
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
}

