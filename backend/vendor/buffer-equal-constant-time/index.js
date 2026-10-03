'use strict';
// Drop-in replacement for buffer-equal-constant-time@1.0.1 (used by jwa, under
// jsonwebtoken). Upstream reads require('buffer').SlowBuffer.prototype at load
// time; SlowBuffer was removed in Node 25, so requiring jsonwebtoken crashed.
// Upstream is unmaintained, so package.json "overrides" points here instead.
var Buffer = require('buffer').Buffer;
var timingSafeEqual = require('crypto').timingSafeEqual;

module.exports = bufferEq;

function bufferEq(a, b) {
  // Same contract as upstream: non-buffers and different lengths are unequal;
  // the length is not secret, the contents are compared in constant time.
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

var origBufEqual = Buffer.prototype.equal;

bufferEq.install = function () {
  Buffer.prototype.equal = function equal(that) {
    return bufferEq(this, that);
  };
};

bufferEq.restore = function () {
  Buffer.prototype.equal = origBufEqual;
};
