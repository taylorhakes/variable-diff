'use strict';

var chalk = require('chalk');

var typeColors = {
  modified: 'yellow',
  added: 'green',
  removed: 'red'
};

var defaultOptions = {
  indent: '  ',
  newLine: '\n',
  wrap: function wrap(type, text) {
    return chalk[typeColors[type]](text);
  },
  color: true
};

function isObject(obj) {
  return typeof obj === 'object' && obj && !Array.isArray(obj);
}

function printVar(variable) {
  if (typeof variable === 'function') {
    return variable.toString().replace(/\{.+\}/,'{}');
  } else if((typeof variable === 'object' || typeof variable === 'string') && !(variable instanceof RegExp)) {
    return JSON.stringify(variable);
  }

  return '' + variable;
}

function indentSubItem(text, options) {
  return text.split(options.newLine).map(function onMap(line, index) {
    if (index === 0) {
      return line;
    }
    return options.indent + line;
  }).join(options.newLine);
}

function keyChanged(key, text, options) {
  return options.indent + key + ': ' + indentSubItem(text, options) + options.newLine
}

function keyRemoved(key, variable, options) {
  return options.wrap('removed', '- ' + key + ': ' + printVar(variable)) + options.newLine;
}

function keyAdded(key, variable, options) {
  return options.wrap('added', '+ ' + key + ': ' + printVar(variable)) + options.newLine;
}

function diffInternal(left, right, options) {
  var text = '';
  var changed = false;
  var itemDiff;
  var keys;
  var subOutput = '';

  if (Array.isArray(left) && Array.isArray(right)) {
    for (var i = 0; i < left.length; i++) {
      if (i < right.length) {
        itemDiff = diffInternal(left[i], right[i], options);
        if (itemDiff.changed) {
          subOutput += keyChanged(i, itemDiff.text, options);
          changed = true;
        }
      } else {
        subOutput += keyRemoved(i, left[i], options);
        changed = true;
      }
    }
    if (right.length > left.length) {
      for (; i < right.length; i++) {
        subOutput +=  keyAdded(i, right[i], options);
      }
      changed = true;
    }
    if (changed) {
      text = '[' + options.newLine + subOutput + ']';
    }
  } else if (isObject(left) && isObject(right)) {
    keys = Object.keys(left);
    var rightObj = Object.assign({}, right);
    var key;
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (right.hasOwnProperty(key)) {
        itemDiff = diffInternal(left[key], right[key], options);
        if (itemDiff.changed) {
          subOutput += keyChanged(key, itemDiff.text, options);
          changed = true;
        }
        delete rightObj[key];
      } else {
        subOutput += keyRemoved(key, left[key], options);
        changed = true;
      }
    }

    var addedKeys = Object.keys(rightObj);
    for (var i = 0; i < addedKeys.length; i++) {
      subOutput += keyAdded(addedKeys[i], right[addedKeys[i]], options);
      changed = true;
    }

    if (changed) {
      text = '{' + options.newLine + subOutput + '}';
    }

  } else if (left !== right) {
    text = options.wrap('modified', printVar(left) + ' => ' + printVar(right));
    changed = true;
  }

  return {
    changed: changed,
    text: text
  };
}

function diff(left, right, options) {
  options = options || {};
  if (!options.color && options.wrap) {
    throw new Error('Can\'t specify wrap and color options together.')
  }

  var combinedOptions = Object.assign({}, defaultOptions, options);
  if (!combinedOptions.color) {
    combinedOptions.wrap = function(type, text) { return text }
  }

  return diffInternal(left, right, combinedOptions)
}


module.exports = diff;