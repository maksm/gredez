const { TextEncoder, TextDecoder } = require('node:util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('jest-environment-jsdom');
const { JSDOM } = require('jsdom');

global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
};

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = jsdom.window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;
global.Node = jsdom.window.Node;
global.HTMLElement = jsdom.window.HTMLElement;

// Mock browser APIs
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob())
  })
);

// Add missing DOM properties
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Make Jest globals available
global.jest = jest;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Clear mocks and DOM between tests
beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
