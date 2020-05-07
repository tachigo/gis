const createError = require('http-errors');
const express = require('express');
const favicon = require('express-favicon');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const parseUrl = require('parseurl');
const session = require('express-session');

const sessionFlash = require('./lib/session-flash');

const app = express();
app.set('trust proxy', 1);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.set("twig options", {
  allow_async: true, // Allow asynchronous compiling
  strict_variables: false
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'basemap',
  name: 'basemap_server',
  cookie: {
    maxAge: 3600 * 1000 // 1h
  },
  resave: false,
  saveUninitialized: true
}));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, '/../../node_modules')));
app.use(favicon(__dirname + '/public/images/favicon.png'));

app.use('*', (req, res, next) => {
  // session flash
  sessionFlash.init(req.session._flashes);
  // 设置跨域
  res.header('Access-Control-Allow-Origin', '*');
  //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  res.header('Access-Control-Allow-Methods', 'HEAD, PUT, GET, POST, DELETE, OPTIONS');
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).send();
  } else {
    // 格式化json返回格式
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' && req.accepts('json')) {
      res.header('Content-Type', 'application/json;charset=utf-8');
      const json = res.json;
      const ret = {
        msg: '',
        code: 0,
        data: {},
        flash: {}
      };
      const flashTypes = ['error', 'warning', 'info', 'success'];
      const initSessionFlash = (flashType) => {
        sessionFlash.all(flashType).forEach(msg => {
          ret.flash[flashType] = ret.flash[flashType] || [];
          ret.flash[flashType].push(msg);
        });
      };
      const initSessionFlashes = () => {
        flashTypes.forEach(flashType => {
          initSessionFlash(flashType);
        });
        req.session._flashes = {};
      };

      res.json = (chunk) => {
        chunk = chunk || {};
        ret.data = chunk;
        initSessionFlashes();
        json.apply(res, [ret]);
        res.json = json;
        console.log('=======================');
      };
      next();
    } else {
      return next();
    }
  }
});

// admin 下检查 session
app.use('*', (req, res, next) => {
  const path = parseUrl(req).pathname;
  req.session.lastPage = path;
  let needLogin = false;
  if (path.indexOf('/admin') === 0
    && path !== '/admin/login'
    && path !== '/admin/logout'
    && path !== '/admin/session') {
    if (!req.session.username) {
      needLogin = true;
    }
  }
  if (needLogin) {
    return res.redirect('/admin/login');
  } else {
    return next();
  }
});

const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');
const gisRouter = require('./routes/gis');
const planetRouter = require('./routes/planet');

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/gis', gisRouter);
app.use('/planet', planetRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(req.method, parseUrl(req).pathname);
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (req.headers['x-requested-with'] === 'XMLHttpRequest' && req.accepts('json')) {
    res.header('Content-Type', 'application/json;charset=utf-8');
    const ret = {
      msg: '',
      code: 0,
      data: {},
      flash: {}
    };
    const flashTypes = ['error', 'warning', 'info', 'success'];
    const initSessionFlash = (flashType) => {
      sessionFlash.all(flashType).forEach(msg => {
        ret.flash[flashType] = ret.flash[flashType] || [];
        ret.flash[flashType].push(msg);
      });
    };
    const initSessionFlashes = () => {
      flashTypes.forEach(flashType => {
        initSessionFlash(flashType);
      });
      req.session._flashes = {};
    };
    sessionFlash.error(err.message);
    ret.msg = err.message;
    ret.code = 0;
    initSessionFlashes();
    console.log(err.stack);
    return res.status(200).json(ret);
  } else {
    // render the error page
    if (err.status === 404) {
      return res.status(err.status).render('404');
    } else {
      return res.status(err.status || 500).render('error');
    }
  }
  // render the error page
  // res.status(err.status || 500);
  // res.render('error');
});

module.exports = app;
