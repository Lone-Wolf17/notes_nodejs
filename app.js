import { default as express } from 'express';
import { default as hbs } from 'hbs';
import * as path from 'path';
// import * as favicon from 'serve-favicon';
import { default as logger } from 'morgan';
import { default as cookieParser } from 'cookie-parser';
import { default as rfs } from 'rotating-file-stream';
import * as http from 'http';
import { approotdir } from './approotdir.js';
import { 
  normalizePort, onError, onListening, handle404, basicErrorHandler
} from './appsupport.js';
import { router as indexRouter } from './routes/index.js';
import { router as notesRouter } from './routes/notes.js';
import { router as usersRouter, initPassport } from './routes/users.js';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import { default as DBG } from 'debug';
import { useModel as useNotesModel } from './models/notes-store.js';

const FileStore = sessionFileStore(session);
const __dirname = approotdir;

export const sessionCookieName = 'notescookie.sid';
export const debug = DBG('notes:debug');
export const dbgError = DBG('notes:error');
export const app = express();

useNotesModel(process.env.NOTES_MODEL ? process.env.NOTES_MODEL : "memory")
  .then(store => {})
  .catch(error => { onError({ code: 'ENOTESSTORE', error}); });


import { default as OS } from 'os';
process.env.UV_THREADPOOL_SIZE = OS.cpus().length

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
  stream: process.env.REQUEST_LOG_FILE ? 
    rfs.createStream(process.env.REQUEST_LOG_FILE, {
      size: '10M',      // rotate every 10 Megabytes written
      interval: '1d',   // rotate daily
      compress: 'gzip'  // compress rotated files
    })
      : process.stdout
}));
if (process.env.REQUEST_LOG_FILE) {
  app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));
}
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new FileStore({ path: "sessions" }),
  secret: 'keyboard mouse',
  resave: false,
  saveUninitialized: false,
  name: sessionCookieName
}));
initPassport(app);
// app.use('/assets/vendor/bootstrap', express.static(
//   path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
// app.use('/assets/vendor/bootstrap', express.static(
//   path.join(__dirname, 'theme', 'dist')));
app.use('/assets/vendor/bootstrap/js', express.static(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/assets/vendor/bootstrap/css', express.static(
  path.join(__dirname, 'minty')));
app.use('/assets/vendor/jquery', express.static(
  path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/assets/vendor/popper.js', express.static(
  path.join(__dirname, 'node_modules', 'popper.js', 'dist', 'umd')));
app.use('/assets/vendor/feather-icons', express.static(
  path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));

// Router function lists 
app.use('/', indexRouter);
app.use('/notes', notesRouter);
app.use('/users', usersRouter);

// error handlers 
// catch 404 and forward to error handler
app.use(handle404);
app.use(basicErrorHandler);

export const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

export const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

server.on('request', (req, res) => {
  debug(`${new Date().toISOString()} request ${req.method} ${req.url}`);
});