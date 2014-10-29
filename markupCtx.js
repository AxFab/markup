/*!
*   Axml
* Copyright 2014-2015 Fabien Bavent
* Released under the BSD license
*/
(function () {
  var previous_mod, root = this
  if (root != null)
    previous_mod = root.markupCtx
  
// Dependancies ===========================================================
  // var fs = root.fs
  // if( typeof fs === 'undefined' ) {
  //   if( typeof require !== 'undefined' ) {
  //     fs = require('fs')
  //   }
  //   else throw new Error('markupCtx requires fs');
  // }

// String extentions ======================================================

  String.prototype.trim=function() {
    return this.replace(/^\s+|\s+$/g, '');
  }

  // ----------------------------------------------------------------------
  String.prototype.ltrim=function() {
    return this.replace(/^\s+/,'');
  }

  // ----------------------------------------------------------------------
  String.prototype.rtrim=function() {
    return this.replace(/\s+$/,'');
  }

  // ----------------------------------------------------------------------
  String.prototype.fulltrim=function() {
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
  }

  // ----------------------------------------------------------------------
  String.prototype.startswith=function(str) {
    return this.substring(0, str.length) == str;
  }

  // ----------------------------------------------------------------------
  String.prototype.endswith=function(str) {
    return this.substring(this.length - str.length, this.length) == str;
  }


// Module markupCtx ==========================================================
  function markupCtx (req) {

    // object scope
    this.current = {};
    this.query = {};
    this.session = {};
    this.il8n = {};
    this.system = {};
    
    // caching capability
    this.caching = 'static'; // static > query > session > volatile
    this.sessionUpdate = false;
    
    /**
     * Get the value of a variable
     * @param {String} [name] variable name
     * @return {String} Value store on the variable
     * @todo Add warning variable is undefined!
     */
    this.varGet = function (name) {
      if (name.startswith('query.')) {
        if (this.caching == 'static')
          this.caching = 'query';
        if (this.query == null)
          this.query = {}
        return this.query[name.substring(6, name.length)];
      }
      if (name.startswith('session.')) {
        if (this.caching != 'volatile')
          this.caching = 'session';
        return this.session[name.substring(8, name.length)];
      }
      if (name.startswith('il8n.')) 
        return this.il8n[name.substring(5, name.length)];
      if (name.startswith('system.')) {
        this.caching = 'volatile';
        return this.system[name.substring(7, name.length)];
      }
      if (name.startswith('current.')) 
        return this.current[name.substring(8, name.length)];
      return this.current[name];
    };
    
    /**
     * Assign a variable
     * @param {String} [name] variable name
     * @param {String} [value] value to store on variable
     */   
    this.varSet = function (name, value) {
      if (name.startswith('session.')) {
        this.sessionUpdate = true;
        this.session[name.substring(8, name.length)] = value;
      }
      if (name.startswith('current.')) 
        this.current[name.substring(8, name.length)] = value;
      if (name.startswith('system.') ||
        name.startswith('query.') ||
        name.startswith('il8n.'))
        throw new Error("Variable " + name + " is read only");
      return this.current[name] = value;
    };
    
    this.setParent = function (uri) {
      this.parentUrl = uri;
    }

    this.getParent = function () {
      return this.parentUrl;
    }

    function dummyTextEval (value) 
    {
      var tokens = []
      var str = '';
      var stre = '';
      var lg = 0
      while (lg < value.length) {
        if (value[lg] == '\'') {
          while (value[++lg] != '\'' && lg < value.length) {
            if (value[lg] == '\\')
              ++lg;
            str += value[lg]
          }
          tokens.push (str);
          str = '';
        } else if (value[lg] == '"') {
          while (value[++lg] != '"' && lg < value.length) {
            if (value[lg] == '\\')
              ++lg;
            str += value[lg]
          }
          tokens.push (str);
          str = '';
        } else {
          while (value[lg] != ' ' && lg < value.length)
            str += value[lg++]
          if (str != '+' && str != '-z' && str != '-n' && str != '-eq' && str != '-ne' && str != '=' && str != '!=') // TODO contains in list of operator !!
            stre = that.varGet (str)
          else stre = str
          if (stre == null) {
            console.warn ('the variable \'' + str + '\' is undefined');
          }
          tokens.push (stre != null ? stre : '');
          str = '';
        }
        
        lg++;
      }
      // console.log ('token', tokens.toString())
      
      if (tokens.length == 1)
        return tokens[0];
      else {
        str = ''
        for  (var i =0; i<tokens.length; ++i) {
          switch(tokens[i]) {
            case '+':
              if (i+1 < tokens.length)
                str += tokens[++i];
              break;
            case '-z':
              if (i+1 < tokens.length)
                str = (tokens[++i] == '' ? true : false);
              break;
            case '-n':
              if (i+1 < tokens.length)
                str = (tokens[++i] != '' ? true : false);
              break;
            case '=':
            case '-eq':
              if (i+1 < tokens.length)
                str = (tokens[++i] == str ? true : false);
              break;
            case '!=':
            case '-ne':
              if (i+1 < tokens.length)
                str = (tokens[++i] != str ? true : false);
              break;
            default:
              str += tokens[i];
              break;
          }
        }
       return str;
      }
    }
    
    this.eval = function (string) {
      return dummyTextEval (string);
    }
    
    var that = this;
    {
      this.query = req.query
    }
  }



// Export the module ======================================================
  markupCtx.noConflict = function () {
    root.markupCtx = previous_mod
    return markupCtx
  }

  if (typeof module !== 'undefined' && module.exports) // Node.js
    module.exports = markupCtx
  else if (typeof exports !== 'undefined')
    exports = module.exports = markupCtx
  else if (typeof define !== 'undefined' && define.amd) // AMD / RequireJS
    define([], function () { return markupCtx })
  else // Browser
    root.markupCtx = markupCtx
  
}).call(this)

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
