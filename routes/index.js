import { default as express } from 'express';
export const router = express.Router();

router.get('/', async (req, res, next) => {
  //.. Placeholder for Notes home page code
  res.render('index', {title: 'Notes'});
});
