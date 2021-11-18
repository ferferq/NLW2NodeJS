import express, { request } from 'express';
import routes from './routes';
import cors from 'cors';

const app = express ();

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(3333);











// get : buscar
// post : criar nova informacao
// put : atualizar uma atualizao 
// delet : deletar

//copo (request, body): Dados para criaçao ou atualização de um registro
// route parms: identificar qual recurso eu quero atualizar ou deletar
// query parms: para paginazação, filtros, cordenaçao
