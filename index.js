/*global
  basename, package, config, yes, prompt, dirname
*/

var fs = require('fs');
var validateLicense = require('validate-npm-package-license');
var validateName = require('validate-npm-package-name');
var npa = require('npm-package-arg');
var semver = require('semver');

var name = package.name || basename;
var spec = npa(name);
var scope = config.get('scope');
if (scope) {
  if (scope.charAt(0) !== '@') scope = '@' + scope;
  if (spec.scope) {
    name = scope + '/' + spec.name.split('/')[1];
  } else {
    name = scope + '/' + name;
  }
}
exports.name =  yes ? name : prompt('name', name, function (data) {
  var its = validateName(data);
  if (its.validForNewPackages) return data;
  var errors = (its.errors || []).concat(its.warnings || []);
  var er = new Error('Sorry, ' + errors.join(' and ') + '.');
  er.notValid = true;
  return er;
});

var version = package.version ||
              config.get('init.version') ||
              config.get('init-version') ||
              '1.0.0';
exports.version = yes ?
  version :
  prompt('version', version, function (version) {
    if (semver.valid(version)) return version;
    var er = new Error('Invalid version: "' + version + '"');
    er.notValid = true;
    return er;
  });

if (!package.description) {
  exports.description = yes ? '' : prompt('description');
}

if (!package.main) {
  exports.main = yes ? 'index.ck' : prompt('entry point', 'index.ck', function (main) {
    if (typeof main === 'string' && main.match(/.\.ck$/)) return main;
    var er = new Error('Invalid main: "' + main + '"');
    er.notValid = true;
    return er;
  });
}

exports.directories = function (cb) {
  fs.readdir(dirname, function (er, dirs) {
    if (er) return cb(er);
    var res = {};
    dirs.forEach(function (d) {
      switch (d) {
      case 'example': case 'examples': return res.example = d;
      case 'doc': case 'docs': return res.doc = d;
      case 'man': return res.man = d;
      }
    });
    if (Object.keys(res).length === 0) res = undefined;
    return cb(null, res);
  });
};

if (!package.scripts) {
  exports.scripts = {
    'start': 'steve start'
  };
}

if (!package.repository) {
  exports.repository = function (cb) {
    fs.readFile('.git/config', 'utf8', function (er, gconf) {
      if (er || !gconf) {
        return cb(null, yes ? '' : prompt('git repository'));
      }
      gconf = gconf.split(/\r?\n/);
      var i = gconf.indexOf('[remote "origin"]');
      if (i !== -1) {
        var u = gconf[i + 1];
        if (!u.match(/^\s*url =/)) u = gconf[i + 2];
        if (!u.match(/^\s*url =/)) u = null;
        else u = u.replace(/^\s*url = /, '');
      }
      if (u && u.match(/^git@github.com:/))
        u = u.replace(/^git@github.com:/, 'https://github.com/');

      return cb(null, yes ? u : prompt('git repository', u));
    });
  };
}

if (!package.keywords) {
  exports.keywords = yes ? '' : prompt('keywords', function (s) {
    if (!s) return undefined;
    if (Array.isArray(s)) s = s.join(' ');
    if (typeof s !== 'string') return s;
    return s.split(/[\s,]+/);
  });
}

if (!package.author) {
  exports.author = config.get('init.author.name') ||
                   config.get('init-author-name')
  ? {
    'name' : config.get('init.author.name') ||
             config.get('init-author-name'),
    'email' : config.get('init.author.email') ||
              config.get('init-author-email'),
    'url' : config.get('init.author.url') ||
            config.get('init-author-url')
  }
  : yes ? '' : prompt('author');
}

var license = package.license ||
              config.get('init.license') ||
              config.get('init-license') ||
              'MIT';
exports.license = yes ? license : prompt('license', license, function (data) {
  var its = validateLicense(data);
  if (its.validForNewPackages) return data;
  var errors = (its.errors || []).concat(its.warnings || []);
  var er = new Error('Sorry, ' + errors.join(' and ') + '.');
  er.notValid = true;
  return er;
});
