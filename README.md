# HTML-Markup

HTML Template engine.

[![Npm version](https://badge.fury.io/js/html-markup.svg)](1)
&nbsp; 
[![Build Status](https://api.travis-ci.org/AxFab/markup.svg?branch=master)](2)

## Installation

    npm install html-markup
    
In case you want to build a server using express as your router.

    npm init
    npm install express 
    npm install html-markup

## Features

  - Complies with the [Express](3) view system
  - Mark command tag using`#{ code /}`


## Commands

The markup language is composed of tag of this form:

    #{command first_Arg, second_Arg, ... /}

The available commands are:

 - __set__: Assign the value of the expression(2) to the variable name(1).
 - __get__: Replace this tag by the value of the expression(1).
 - __get_if__: If the condition(1) is true, replace this tag by the value of the expression(2) else by the second expression(3).
 - __include__: Insert the content of the file indicate by the value of the expression(1).
 - __doLayout___: Insert the content of the child template.
 - __extends___: Define the parent of this template (see [extends](#extends)).

```html
#{set title,'MyPage' /}
#{set menu,'home' /}
#{extends '/model.html' /}
<div>...</div>
#{include '/menu-' + menu + '.html' /}
<p>Bienvenue sur #{get title/}</p>
```


## Usage

You can use this script of three different ways.
On command line:
    > node markup.js [html_file]
    
On your script:
```js
var markup = require ('markup')
markup.renderFile(path, options, function (err, data) {
 //...
});
```

Using Express:
```js
var markup = require('markup')
var express = require('express');
var app = express();

app.engine('html', markup.renderFile);
app.set('views', markup.directory); // specify the views directory
app.set('view engine', 'html'); // register the template engine

// What's on /dist folder is freely accessible
app.get('/dist', express.static(__dirname + '/dist'));
// For the rest, we use the engine
app.get('/', markup.lookFor)

app.listen(80);

```


## Options

  - `cache`           If true, will keep static page into memory.
  - `params`         Array of values accessible via `params.name`
  - `query`           Array of values accessible via `params.query`
  - `debug`           Output debug information
  - `open`            Open tag, defaulting to "#{
  - `close`           Closing tag, defaulting to "/}"
  - `directory`   Change of directory (default is `./views`)


## Extends

A real advantage about this template is to insert content of other pages. 
You have two way of doing this, the extends and include commands.

The extends allow to define a parent. This is always the last executed command on the page.

## Example

##### ./views/model.html
```html
<html>
  <head>
    <title>#{get title/}</title>
    ...
  </head>
  <body>
    <header>
    ...
    #{include '/menu.html' /}
    </header>
    <div id="content">
    #{doLayout /}
    </div>
    <footer>...</footer>
  <body>
<html>
```

##### ./views/index.html
```html
#{set title 'MyPage' /}
#{set menu, 'home' /}
#{extends '/models.html' /}
<h1>Welcome #{get_if query.user!=null, query.user, 'new visitor'}!</h1>
<p>This is my page</p>
```

##### ./views/menu.html
```html
<ul class="nav">
  <li class="#{get_if menu=='home', 'active'/}"><a href="#">Home</a>
  <li class="#{get_if menu=='ptfl', 'active'/}"><a href="#">Portfolio</a>
  <li class="#{get_if menu=='about', 'active'/}"><a href="#">About</a>
</ul>
```

##### RENDER (indentation corrected)  /index.html?user=Fab
```html
<html>
  <head>
    <title>MyPage</title>
    ...
  </head>
  <body>
    <header>
    ...
      <ul class="nav">
        <li class="active"><a href="#">Home</a>
        <li class=""><a href="#">Portfolio</a>
        <li class=""><a href="#">About</a>
      </ul>
    </header>
    <div id="content">
      <h1>Welcome Fab!</h1>
      <p>This is my page</p>
    </div>
    <footer>...</footer>
  <body>
<html>
```


## License
This code is under the modified BSD license.


 [1]: https://badge.fury.io/js/html-markup
 [2]: http://travis-ci.org/axfab/markup
 [3]: http://expressjs.com
