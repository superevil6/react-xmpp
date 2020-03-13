import React from 'react';
import './App.css';
import XMPP from './Components/XMPP';

function App() {
  return (
    <div className="App">
        <XMPP 
        server="https://conference.alexcassells.com:5281/http-bind" //add your bosh or websocket XMPP server here ex: https://conference.example.com:5281/http-bind
        domain='alexcassells.com' //add your jid domain here ex: example.com
        MUC='conference.alexcassells.com'  //add your multi user chat address here ex: conference.example.com
        mainColor='#000000' 
        secondaryColor='#00FF00' 
        textColor='#FFFFFF'
        width='100%'
        height='500px'
        />
    </div>
  );
}

export default App;
