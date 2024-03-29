/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
 HMAC implementation as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2017
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';
(function(L) {
  function u(d, b, h) {
    var c = 0,
      a = [],
      l = 0,
      e,
      m,
      r,
      g,
      k,
      f,
      p,
      v,
      A = !1,
      n = [],
      u = [],
      w,
      z = !1,
      x = !1,
      t = -1;
    h = h || {};
    e = h.encoding || 'UTF8';
    w = h.numRounds || 1;
    if (w !== parseInt(w, 10) || 1 > w)
      throw Error('numRounds must a integer >= 1');
    if (0 === d.lastIndexOf('SHA3-', 0) || 0 === d.lastIndexOf('SHAKE', 0)) {
      var C = 6;
      f = B;
      v = function(c) {
        var a = [],
          e;
        for (e = 0; 5 > e; e += 1) a[e] = c[e].slice();
        return a;
      };
      t = 1;
      if ('SHA3-224' === d) (k = 1152), (g = 224);
      else if ('SHA3-256' === d) (k = 1088), (g = 256);
      else if ('SHA3-384' === d) (k = 832), (g = 384);
      else if ('SHA3-512' === d) (k = 576), (g = 512);
      else if ('SHAKE128' === d) (k = 1344), (g = -1), (C = 31), (x = !0);
      else if ('SHAKE256' === d) (k = 1088), (g = -1), (C = 31), (x = !0);
      else throw Error('Chosen SHA variant is not supported');
      p = function(c, a, e, g, d) {
        e = k;
        var b = C,
          m,
          l = [],
          f = e >>> 5,
          h = 0,
          r = a >>> 5;
        for (m = 0; m < r && a >= e; m += f)
          (g = B(c.slice(m, m + f), g)), (a -= e);
        c = c.slice(m);
        for (a %= e; c.length < f; ) c.push(0);
        m = a >>> 3;
        c[m >> 2] ^= b << (m % 4 * 8);
        c[f - 1] ^= 2147483648;
        for (g = B(c, g); 32 * l.length < d; ) {
          c = g[h % 5][(h / 5) | 0];
          l.push(c.b);
          if (32 * l.length >= d) break;
          l.push(c.a);
          h += 1;
          0 === 64 * h % e && B(null, g);
        }
        return l;
      };
    } else throw Error('Chosen SHA variant is not supported');
    r = D(b, e, t);
    m = y(d);
    this.setHMACKey = function(a, b, l) {
      var h;
      if (!0 === A) throw Error('HMAC key already set');
      if (!0 === z) throw Error('Cannot set HMAC key after calling update');
      if (!0 === x) throw Error('SHAKE is not supported for HMAC');
      e = (l || {}).encoding || 'UTF8';
      b = D(b, e, t)(a);
      a = b.binLen;
      b = b.value;
      h = k >>> 3;
      l = h / 4 - 1;
      if (h < a / 8) {
        for (b = p(b, a, 0, y(d), g); b.length <= l; ) b.push(0);
        b[l] &= 4294967040;
      } else if (h > a / 8) {
        for (; b.length <= l; ) b.push(0);
        b[l] &= 4294967040;
      }
      for (a = 0; a <= l; a += 1)
        (n[a] = b[a] ^ 909522486), (u[a] = b[a] ^ 1549556828);
      m = f(n, m);
      c = k;
      A = !0;
    };
    this.update = function(e) {
      var b,
        g,
        d,
        h = 0,
        p = k >>> 5;
      b = r(e, a, l);
      e = b.binLen;
      g = b.value;
      b = e >>> 5;
      for (d = 0; d < b; d += p)
        h + k <= e && ((m = f(g.slice(d, d + p), m)), (h += k));
      c += h;
      a = g.slice(h >>> 5);
      l = e % k;
      z = !0;
    };
    this.getHash = function(e, b) {
      var h, f, r, k;
      if (!0 === A) throw Error('Cannot call getHash after setting HMAC key');
      r = E(b);
      if (!0 === x) {
        if (-1 === r.shakeLen)
          throw Error('shakeLen must be specified in options');
        g = r.shakeLen;
      }
      switch (e) {
        case 'HEX':
          h = function(a) {
            return F(a, g, t, r);
          };
          break;
        case 'B64':
          h = function(a) {
            return G(a, g, t, r);
          };
          break;
        case 'BYTES':
          h = function(a) {
            return H(a, g, t);
          };
          break;
        case 'ARRAYBUFFER':
          try {
            f = new ArrayBuffer(0);
          } catch (q) {
            throw Error('ARRAYBUFFER not supported by this environment');
          }
          h = function(a) {
            return I(a, g, t);
          };
          break;
        default:
          throw Error('format must be HEX, B64, BYTES, or ARRAYBUFFER');
      }
      k = p(a.slice(), l, c, v(m), g);
      for (f = 1; f < w; f += 1)
        !0 === x &&
          0 !== g % 32 &&
          (k[k.length - 1] &= 16777215 >>> (24 - g % 32)), (k = p(
          k,
          g,
          0,
          y(d),
          g
        ));
      return h(k);
    };
    this.getHMAC = function(e, b) {
      var h, r, n, w;
      if (!1 === A)
        throw Error('Cannot call getHMAC without first setting HMAC key');
      n = E(b);
      switch (e) {
        case 'HEX':
          h = function(a) {
            return F(a, g, t, n);
          };
          break;
        case 'B64':
          h = function(a) {
            return G(a, g, t, n);
          };
          break;
        case 'BYTES':
          h = function(a) {
            return H(a, g, t);
          };
          break;
        case 'ARRAYBUFFER':
          try {
            h = new ArrayBuffer(0);
          } catch (M) {
            throw Error('ARRAYBUFFER not supported by this environment');
          }
          h = function(a) {
            return I(a, g, t);
          };
          break;
        default:
          throw Error('outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER');
      }
      r = p(a.slice(), l, c, v(m), g);
      w = f(u, y(d));
      w = p(r, g, k, w, g);
      return h(w);
    };
  }
  function f(d, b) {
    this.a = d;
    this.b = b;
  }
  function F(d, b, h, c) {
    var a = '';
    b /= 8;
    var l, e, m;
    m = -1 === h ? 3 : 0;
    for (l = 0; l < b; l += 1)
      (e = d[l >>> 2] >>> (8 * (m + l % 4 * h))), (a +=
        '0123456789abcdef'.charAt((e >>> 4) & 15) +
        '0123456789abcdef'.charAt(e & 15));
    return c.outputUpper ? a.toUpperCase() : a;
  }
  function G(d, b, h, c) {
    var a = '',
      l = b / 8,
      e,
      m,
      f,
      g;
    g = -1 === h ? 3 : 0;
    for (e = 0; e < l; e += 3)
      for (
        m = e + 1 < l ? d[(e + 1) >>> 2] : 0, f =
          e + 2 < l ? d[(e + 2) >>> 2] : 0, f =
          (((d[e >>> 2] >>> (8 * (g + e % 4 * h))) & 255) << 16) |
          (((m >>> (8 * (g + (e + 1) % 4 * h))) & 255) << 8) |
          ((f >>> (8 * (g + (e + 2) % 4 * h))) & 255), m = 0;
        4 > m;
        m += 1
      )
        8 * e + 6 * m <= b
          ? (a += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(
              (f >>> (6 * (3 - m))) & 63
            ))
          : (a += c.b64Pad);
    return a;
  }
  function H(d, b, h) {
    var c = '';
    b /= 8;
    var a, l, e;
    e = -1 === h ? 3 : 0;
    for (a = 0; a < b; a += 1)
      (l =
        (d[a >>> 2] >>> (8 * (e + a % 4 * h))) &
        255), (c += String.fromCharCode(l));
    return c;
  }
  function I(d, b, h) {
    b /= 8;
    var c,
      a = new ArrayBuffer(b),
      l,
      e;
    e = new Uint8Array(a);
    l = -1 === h ? 3 : 0;
    for (c = 0; c < b; c += 1)
      e[c] = (d[c >>> 2] >>> (8 * (l + c % 4 * h))) & 255;
    return a;
  }
  function E(d) {
    var b = { outputUpper: !1, b64Pad: '=', shakeLen: -1 };
    d = d || {};
    b.outputUpper = d.outputUpper || !1;
    !0 === d.hasOwnProperty('b64Pad') && (b.b64Pad = d.b64Pad);
    if (!0 === d.hasOwnProperty('shakeLen')) {
      if (0 !== d.shakeLen % 8) throw Error('shakeLen must be a multiple of 8');
      b.shakeLen = d.shakeLen;
    }
    if ('boolean' !== typeof b.outputUpper)
      throw Error('Invalid outputUpper formatting option');
    if ('string' !== typeof b.b64Pad)
      throw Error('Invalid b64Pad formatting option');
    return b;
  }
  function D(d, b, h) {
    switch (b) {
      case 'UTF8':
      case 'UTF16BE':
      case 'UTF16LE':
        break;
      default:
        throw Error('encoding must be UTF8, UTF16BE, or UTF16LE');
    }
    switch (d) {
      case 'HEX':
        d = function(c, a, b) {
          var e = c.length,
            d,
            f,
            g,
            k,
            q,
            p;
          if (0 !== e % 2)
            throw Error('String of HEX type must be in byte increments');
          a = a || [0];
          b = b || 0;
          q = b >>> 3;
          p = -1 === h ? 3 : 0;
          for (d = 0; d < e; d += 2) {
            f = parseInt(c.substr(d, 2), 16);
            if (isNaN(f))
              throw Error('String of HEX type contains invalid characters');
            k = (d >>> 1) + q;
            for (g = k >>> 2; a.length <= g; ) a.push(0);
            a[g] |= f << (8 * (p + k % 4 * h));
          }
          return { value: a, binLen: 4 * e + b };
        };
        break;
      case 'TEXT':
        d = function(c, a, d) {
          var e,
            m,
            f = 0,
            g,
            k,
            q,
            p,
            v,
            n;
          a = a || [0];
          d = d || 0;
          q = d >>> 3;
          if ('UTF8' === b)
            for (n = -1 === h ? 3 : 0, g = 0; g < c.length; g += 1)
              for (
                e = c.charCodeAt(g), m = [], 128 > e
                  ? m.push(e)
                  : 2048 > e
                    ? (m.push(192 | (e >>> 6)), m.push(128 | (e & 63)))
                    : 55296 > e || 57344 <= e
                      ? m.push(
                          224 | (e >>> 12),
                          128 | ((e >>> 6) & 63),
                          128 | (e & 63)
                        )
                      : (
                          (g += 1),
                          (e =
                            65536 +
                            (((e & 1023) << 10) | (c.charCodeAt(g) & 1023))),
                          m.push(
                            240 | (e >>> 18),
                            128 | ((e >>> 12) & 63),
                            128 | ((e >>> 6) & 63),
                            128 | (e & 63)
                          )
                        ), k = 0;
                k < m.length;
                k += 1
              ) {
                v = f + q;
                for (p = v >>> 2; a.length <= p; ) a.push(0);
                a[p] |= m[k] << (8 * (n + v % 4 * h));
                f += 1;
              }
          else if ('UTF16BE' === b || 'UTF16LE' === b)
            for (
              n = -1 === h ? 2 : 0, m =
                ('UTF16LE' === b && 1 !== h) ||
                ('UTF16LE' !== b && 1 === h), g = 0;
              g < c.length;
              g += 1
            ) {
              e = c.charCodeAt(g);
              !0 === m && ((k = e & 255), (e = (k << 8) | (e >>> 8)));
              v = f + q;
              for (p = v >>> 2; a.length <= p; ) a.push(0);
              a[p] |= e << (8 * (n + v % 4 * h));
              f += 2;
            }
          return { value: a, binLen: 8 * f + d };
        };
        break;
      case 'B64':
        d = function(c, a, b) {
          var e = 0,
            d,
            f,
            g,
            k,
            q,
            p,
            n,
            u;
          if (-1 === c.search(/^[a-zA-Z0-9=+\/]+$/))
            throw Error('Invalid character in base-64 string');
          f = c.indexOf('=');
          c = c.replace(/\=/g, '');
          if (-1 !== f && f < c.length)
            throw Error("Invalid '=' found in base-64 string");
          a = a || [0];
          b = b || 0;
          p = b >>> 3;
          u = -1 === h ? 3 : 0;
          for (f = 0; f < c.length; f += 4) {
            q = c.substr(f, 4);
            for (g = k = 0; g < q.length; g += 1)
              (d = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(
                q[g]
              )), (k |= d << (18 - 6 * g));
            for (g = 0; g < q.length - 1; g += 1) {
              n = e + p;
              for (d = n >>> 2; a.length <= d; ) a.push(0);
              a[d] |= ((k >>> (16 - 8 * g)) & 255) << (8 * (u + n % 4 * h));
              e += 1;
            }
          }
          return { value: a, binLen: 8 * e + b };
        };
        break;
      case 'BYTES':
        d = function(c, a, b) {
          var e, d, f, g, k, n;
          a = a || [0];
          b = b || 0;
          f = b >>> 3;
          n = -1 === h ? 3 : 0;
          for (d = 0; d < c.length; d += 1)
            (e = c.charCodeAt(d)), (k = d + f), (g = k >>> 2), a.length <= g &&
              a.push(0), (a[g] |= e << (8 * (n + k % 4 * h)));
          return { value: a, binLen: 8 * c.length + b };
        };
        break;
      case 'ARRAYBUFFER':
        try {
          d = new ArrayBuffer(0);
        } catch (c) {
          throw Error('ARRAYBUFFER not supported by this environment');
        }
        d = function(c, a, b) {
          var d, f, n, g, k, q;
          a = a || [0];
          b = b || 0;
          f = b >>> 3;
          k = -1 === h ? 3 : 0;
          q = new Uint8Array(c);
          for (d = 0; d < c.byteLength; d += 1)
            (g = d + f), (n = g >>> 2), a.length <= n && a.push(0), (a[n] |=
              q[d] << (8 * (k + g % 4 * h)));
          return { value: a, binLen: 8 * c.byteLength + b };
        };
        break;
      default:
        throw Error('format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER');
    }
    return d;
  }
  function z(d, b) {
    return 32 < b
      ? (
          (b -= 32),
          new f(
            (d.b << b) | (d.a >>> (32 - b)),
            (d.a << b) | (d.b >>> (32 - b))
          )
        )
      : 0 !== b
        ? new f(
            (d.a << b) | (d.b >>> (32 - b)),
            (d.b << b) | (d.a >>> (32 - b))
          )
        : d;
  }
  function n(d, b) {
    return new f(d.a ^ b.a, d.b ^ b.b);
  }
  function y(d) {
    var b = [];
    if (0 === d.lastIndexOf('SHA3-', 0) || 0 === d.lastIndexOf('SHAKE', 0))
      for (d = 0; 5 > d; d += 1)
        b[d] = [
          new f(0, 0),
          new f(0, 0),
          new f(0, 0),
          new f(0, 0),
          new f(0, 0)
        ];
    else throw Error('No SHA variants supported');
    return b;
  }
  function B(d, b) {
    var h,
      c,
      a,
      l,
      e = [],
      m = [];
    if (null !== d)
      for (c = 0; c < d.length; c += 2)
        b[(c >>> 1) % 5][((c >>> 1) / 5) | 0] = n(
          b[(c >>> 1) % 5][((c >>> 1) / 5) | 0],
          new f(d[c + 1], d[c])
        );
    for (h = 0; 24 > h; h += 1) {
      l = y('SHA3-');
      for (c = 0; 5 > c; c += 1) {
        a = b[c][0];
        var r = b[c][1],
          g = b[c][2],
          k = b[c][3],
          q = b[c][4];
        e[c] = new f(a.a ^ r.a ^ g.a ^ k.a ^ q.a, a.b ^ r.b ^ g.b ^ k.b ^ q.b);
      }
      for (c = 0; 5 > c; c += 1) m[c] = n(e[(c + 4) % 5], z(e[(c + 1) % 5], 1));
      for (c = 0; 5 > c; c += 1)
        for (a = 0; 5 > a; a += 1) b[c][a] = n(b[c][a], m[c]);
      for (c = 0; 5 > c; c += 1)
        for (a = 0; 5 > a; a += 1)
          l[a][(2 * c + 3 * a) % 5] = z(b[c][a], J[c][a]);
      for (c = 0; 5 > c; c += 1)
        for (a = 0; 5 > a; a += 1)
          b[c][a] = n(
            l[c][a],
            new f(
              ~l[(c + 1) % 5][a].a & l[(c + 2) % 5][a].a,
              ~l[(c + 1) % 5][a].b & l[(c + 2) % 5][a].b
            )
          );
      b[0][0] = n(b[0][0], K[h]);
    }
    return b;
  }
  var J, K;
  K = [
    new f(0, 1),
    new f(0, 32898),
    new f(2147483648, 32906),
    new f(2147483648, 2147516416),
    new f(0, 32907),
    new f(0, 2147483649),
    new f(2147483648, 2147516545),
    new f(2147483648, 32777),
    new f(0, 138),
    new f(0, 136),
    new f(0, 2147516425),
    new f(0, 2147483658),
    new f(0, 2147516555),
    new f(2147483648, 139),
    new f(2147483648, 32905),
    new f(2147483648, 32771),
    new f(2147483648, 32770),
    new f(2147483648, 128),
    new f(0, 32778),
    new f(2147483648, 2147483658),
    new f(2147483648, 2147516545),
    new f(2147483648, 32896),
    new f(0, 2147483649),
    new f(2147483648, 2147516424)
  ];
  J = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14]
  ];
  'function' === typeof define && define.amd
    ? define(function() {
        return u;
      })
    : 'undefined' !== typeof exports
      ? (
          'undefined' !== typeof module &&
            module.exports &&
            (module.exports = u),
          (exports = u)
        )
      : (L.jsSHA = u);
})(this);
