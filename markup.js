/*!
*   Axml
* Copyright 2014-2015 Fabien Bavent
* Released under the BSD license
*/
(function () {
  var previous_mod, root = this
  if (root != null)
    previous_mod = root.markup
  
  var DEBUG = true

// Dependancies ===========================================================
  var fs = root.fs
  if( typeof fs === 'undefined' ) {
    if( typeof require !== 'undefined' ) {
      fs = require('fs')
    }
    else throw new Error('markup requires fs');
  }

  var async = root.async
  if( typeof async === 'undefined' ) {
    if( typeof require !== 'undefined' ) {
      async = require('async')
    }
    else throw new Error('markup requires async');
  }

  var markupCtx = root.markupCtx
  if( typeof markupCtx === 'undefined' ) {
    if( typeof require !== 'undefined' ) {
      markupCtx = require('./markupCtx')
    }
    else throw new Error('markup requires markupCtx');
  }

// Module markup =========================================================

  var markup = function (options) {
    if (!(this instanceof markup))
      return new markup(options);

    this.super_ = stream.Transform
    stream.Transform.call (this)
    this._init (options)
  }

  // ======================================================================
  // axml.prototype = Object.create (stream.Transform.prototype, {})
  markup.commands = {

    extends:function (mark, ctx) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 1) {
        console.error ('The command \'extends\' take one argument');
        return null;
      }
      ctx.setParent (ctx.eval (mark.value[0]))
      return null;
    },

    set:function (mark, ctx, callback) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 2) {
        callback ('The command \'set\' take two arguments');
        return null;
      }
      ctx.varSet(mark.value[0], ctx.eval (mark.value[1]))
      callback();
    },

    get:function (mark, ctx, callback) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 1) {
        callback ('The command \'get\' take one argument');
        return null;
      }

      mark.data = ctx.eval (mark.value[0])
      callback()
    },

    get_if:function (mark, ctx, callback) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 2 && mark.value.length != 3) {
        callback ('The command \'get_if\' take two or three arguments');
        return null;
      }
      
      var cdt = ctx.eval (mark.value[0]);
      var v = (cdt != '' && cdt != false) ? 1 : 2
      if (v == 2 && mark.value.length == 2)
        mark.data = ''
      else 
        mark.data = ctx.eval (mark.value[v])
      callback()
    },

    doLayout:function (mark, ctx, callback) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 1) {
        callback ('The command \'doLayout\' take one argument');
        return null;
      } else {
        mark.data = ctx.childData
        callback();
      }
    },

    include:function (mark, ctx, callback) {
      if (markup.debug) console.log ('    ' + mark.literal)
      if (mark.value.length != 1) {
        callback ('The command \'include\' take one argument');
        return null;
      } else {
        markup.renderFile (ctx.eval(mark.value[0]), ctx, function (err, data) {

          mark.data = data
          callback();
        })
      }
    }
  }

  // ----------------------------------------------------------------------
  // axml.prototype._transform = function(chunk, encoding, callback) {
  markup.directory = './views'

  // ----------------------------------------------------------------------
  markup.renderFile = function (path, options, callback) {

    if (path.startswith ('/'))
      path = markup.directory + path;

    if (options == null)
      options = new markupCtx({});
    else if (!options.getParent)
      options = new markupCtx(options)

    if (markup.debug) console.log ('renderFile', path)

    fs.readFile (path, function (err, data) {
      if (err && !path.endswith ('/500.html')) {
        console.error (path, err)
        markup.renderFile ('/500.html', options, callback)
      } else if (err) {
        callback (err, null)
      } else {
        // Note: sending a buffer will put the file to download, send a string!
        markup.parseFile (data, options, callback)
      }

    })
    // callback (null, '<h1>Yep !?</h1>\n')
  }

  // ----------------------------------------------------------------------
  markup.finish = function (array, options, callback) {

    data = ''
    for (var i=0; i < array.length; ++i) {
      if (typeof array[i] === 'string')
        data += array[i]
      else if (array[i].data != null)
        data += array[i].data
    }

    if (options.getParent() == null) {
      callback (null, data)
    } else {
      options.childData = data
      var url = options.getParent()
      options.setParent(null)
      markup.renderFile (url, options, callback)
    }
  }

  // ----------------------------------------------------------------------
  markup.doCommand = function (cmd, options, callback) {

    // if (cmd == 'extends')
    markup.commands[cmd.type] (cmd, options, callback)
      // cmd.data = cmd.type
      // callback ()
  }

  // ----------------------------------------------------------------------
  markup.parseFile = function (data, options, callback) {
    // console.log (data.toString())
    var array = []
    var parent = null;
    data = data.toString()
    var commands = []

    // Split data and commands
    for (;;) {
      var l = data.match(/#\{.*\/\}/)
      if (l == null) break
      if (l.index > 0)
        array.push (data.substring(0, l.index))
      data = data.substring (l.index + l[0].length)
      var cmd = markup.parseCommand(l[0])
      array.push (cmd)
      if (cmd.type != 'extends')
        commands.push (cmd)
      else
        parent = cmd 
    }

    array.push (data)
    if (markup.debug) console.log ('File made of '+array.length+' blocks using '+commands.length+' commands')
    if (markup.debug && parent) console.log ('File have parent: '+ parent.value[0])


    // Regroup page
    if (commands.length == 0) {
      if (parent)
        markup.commands.extends (parent, options)
      markup.finish (array, options, callback)

    } else {

      async.each (commands, function (cmd, callback) {
        if (markup.commands[cmd.type] == null)
          callback('No command named ' + cmd.type)
        else
          markup.commands[cmd.type] (cmd, options, callback)
      }, function (err) {
        if (err) callback (err, null)
        else {
          if (parent)
            markup.commands.extends (parent, options)
          markup.finish (array, options, callback)
        }
      })
    }
  }

  // ----------------------------------------------------------------------
  markup.parseCommand = function (mark) {

    var tag = mark.substring(2);
    var c = '';
    
    while (tag[0] <= ' ')
      tag = tag.substring(1);

    while (tag[0] > ' ') {
      c += tag.substring(0, 1);
      tag = tag.substring(1);
    }
    
    if (c == '/}') {
      console.warn('Empty tag')
    }
    
    var command = c;
    var args = [];
    c = '';
    for (;;) {
      while (tag[0] <= ' ')
        tag = tag.substring(1);

      while (tag[0] != ':' && (tag[0] != '/' || tag[1] != '}')) { 
        c += tag.substring(0, 1);
        tag = tag.substring(1);
      }
      
      if (c == '/}' || c == '}') {
        console.log('Cmd: '+ args);
        return;
      }
      
      c = c.trim();
      args.push(c);
      c = '';
      
      if (tag[0] == '/' && tag[1] == '}')
        return {type:command, value:args, literal:mark };
      tag = tag.substring(1);
    }
  }


  // ----------------------------------------------------------------------
  markup.lookFor = function(req, res) {
    // Note: As express doesn't allow to recover we try to check 
    // everything first, but it's a bad design !
    fs.exists (markup.directory + req.url, function (exist) {
      if (req.url.endswith('/')) {
        res.render (req.url.substring(1) + 'index');
      } else if (exist) {
        var name = req.url.substring(1, req.url.length - 5) // Seriously !? (REMOVE .html)
        res.render (name);
      } else {
        if (markup.debug) console.log ('Could not find the file', markup.directory + req.url)
        res.render ('404'); // File not found!
      }
    })
  }


  // ----------------------------------------------------------------------
  markup.lookAt = function(directory) {
    return function (req, res) {
      fs.exists (directory + req.url, function (exist) {
        if (req.url.endswith('/')) {
          res.render (req.url.substring(1) + 'index');
        } else if (exist) {
          var name = req.url.substring(1, req.url.length - 5) // Seriously !? (REMOVE .html)
          res.render (name);
        } else {
          if (markup.debug) console.log ('Could not find the file', directory + req.url)
          res.render ('404'); // File not found!
        }
      })
    }
  }


// Export the module ======================================================
  markup.noConflict = function () {
    root.markup = previous_mod
    return markup
  }

  if (typeof module !== 'undefined' && module.exports) // Node.js
    module.exports = markup
  else if (typeof exports !== 'undefined')
    exports = module.exports = markup
  else if (typeof define !== 'undefined' && define.amd) // AMD / RequireJS
    define([], function () { return markup })
  else // Browser
    root.markup = markup
  

  if (require && require.main === module) {

    // console.log (process.argv[2])
    markup.renderFile(process.argv[2], null, function (err, data) {
      console.log ('DATA:')
      console.log (data)
    })
  }


}).call(this)




// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
