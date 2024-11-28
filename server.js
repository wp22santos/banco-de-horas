import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3000;

// Configurar CORS
app.use(cors());

// Configurar body parser, exceto para webhook
app.use((req, res, next) => {
  express.json()(req, res, next);
});

// Servir arquivos estáticos do build do Vite
app.use(express.static(join(__dirname, 'dist')));

// Todas as outras rotas servem o index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
