import React from 'react';
import './App.css';
import XMPP from './Components/XMPP';

function App() {
  return (
    <div className="App">
        <XMPP 
        server="https://conference.alexcassells.com:5281/http-bind" 
        MUC='conference.alexcassells.com' 
        mainColor='#333333' 
        secondaryColor='#00FF00' 
        textColor='#FFFFFF'
        width='400px'
        />
    </div>
  );
}

export default App;
