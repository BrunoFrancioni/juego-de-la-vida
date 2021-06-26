import React from 'react';
import './App.css';
import Game from './components/Game/Game';

function App() {
  return (
    <div className="App">
      <section className="section">
        <div className="container">
          <h1 className="title">
            Juego de la Vida
          </h1>

          <Game />
        </div>
      </section>
    </div>
  );
}

export default App;
