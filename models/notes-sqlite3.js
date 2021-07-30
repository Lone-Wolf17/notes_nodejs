import util from 'util';
import { Note, AbstractNotesStore } from './Notes.js';
import { default as sqlite3 } from 'sqlite3';
import { default as DBG } from 'debug';
import { resolve } from 'path';

const debug = DBG('notes:notes-sqlite3');
const error = DBG('notes:error-sqlite3');

const tablename = 'notes';
const keycol = 'notekey';
const titlecol = 'title';
const bodycol = 'body';

let db;

async function connectDB () {
    if (db) return db;

    const dbfile = process.env.SQLITE_FILE || "notes.sqlite3";
    await new Promise ((resolve, reject) => {
        db = new sqlite3.Database(dbfile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
            err => {
                if (err) return reject (err);
                resolve(db);
            });
    });
    return db;
}

export default class SQLITE3NotesStore extends AbstractNotesStore {

    async close () {
        const _db = db;
        db = undefined;
        return _db ? 
            new Promise ((resolve, reject) => {
                _db.close(err => {
                    if (err) reject(err);
                    else resolve();
                });
            }) : undefined;
    }

    async update(key, title, body) {
        const db = await connectDB();
        const note = new Note(key, title, body);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE ${tablename} ` 
                + `SET ${titlecol} = ?, ${bodycol}=? WHERE ${keycol}=?`, 
                [ title, body, key ], err => {
                    if (err) return reject(err);
                    resolve (note);
                });
        });

        return note;
    }

    async create (key, title, body) {
        const db = await connectDB();
        const note = new Note (key, title, body);
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO ${tablename} ( ${keycol}, ${titlecol}, ${bodycol} ) `
                + "VALUES ( ?, ?, ?);", [ key, title, body ], err => {
                    if (err) return reject (err);
                    resolve(note);
                });
        });
        return note;
    }

    async read (key) {
        const db = await connectDB();
        const note = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM ${tablename} WHERE ${keycol} = ?`, 
                [ key ], (err, row) => {
                    if (err) return reject (err);
                    const note = new Note(row.notekey, row.title, row.body);
                    resolve(note);
                });
        });
        return note;
    }

    async destroy (key) {
        const db = await connectDB();

        return await new Promise((resolve, reject) => {
            db.run(`DELETE FROM ${tablename} where ${keycol} = ?;`, [ key ], 
                err => {
                    if (err) return reject(err);
                    resolve();
                });
        });
    }

    async keylist () {
        const db = await connectDB();
        const keyz = await new Promise((resolve, reject) => {
            const keyz = [];
            db.all(`SELECT ${keycol} FROM ${tablename}`, (err, rows) => {
                if (err) return reject (err);
                resolve(rows.map(row => { return row.notekey; }));
            });
        });
        return keyz;
    }

    async count() {
        const db = await connectDB();
        const count = await new Promise((resolve, reject) => {
            db.get(`SELECT count(${keycol}) as count from ${tablename} `, 
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row.count);
                });
        });
        return count;
    }
}