import React from 'react';
import './App.css';
import XMPP from './Components/XMPP';

function App() {
  return (
    <div className="App">
        <XMPP 
        server="" //add your bosh or websocket XMPP server here ex: https://conference.example.com:5281/http-bind
        domain='' //add your jid domain here ex: example.com
        MUC=''  //add your multi user chat address here ex: conference.example.com
        mainColor='#FFFFFF' 
        secondaryColor='#999999' 
        textColor='#000000'
        width='1000px'
        />
    </div>
  );
}

export default App;
