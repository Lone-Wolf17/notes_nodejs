import { default as express } from 'express';
import { NotesStore as notes } from '../models/notes-store.js';
export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    
    const keylist = await notes.keylist();
    const keyPromises = keylist.map(key => {
      return notes.read(key);
    });
    const notelist = await Promise.all(keyPromises);
    res.render('index', {
      title: 'Notes', notelist: notelist,
      user: req.user ? req.user : undefined
    });
  } catch (err) {
    next (err);
  }

});
