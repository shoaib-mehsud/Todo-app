import express from 'express';

const app = express();

app.use(express.json());

import authRoute from './routes/auth.js';
import todoRoute from './routes/todo.js';

app.use('/user', authRoute);  
app.use('/todo', todoRoute);


app.listen(3000);