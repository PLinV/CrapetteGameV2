const express = require('express');
const app = express();
const port = 3000;

// Création d'une route : quand on visite la page d'accueil ('/'), on renvoie ce texte
app.get('/', (req, res) => {
  res.send('hello world');
});

// On demande au serveur d'écouter les requêtes sur le port 3000
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});