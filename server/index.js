import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  res.json({ message: `Echo: ${message}` });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 