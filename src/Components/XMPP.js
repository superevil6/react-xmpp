import React from 'react';
import {Strophe} from 'node-strophe';
import ReactDOM from 'react-dom';
import {animateScroll} from 'react-scroll';
import './XMPP.css';

class XMPP extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            jid: 'test2@alexcassells.com',
            password: 'test',
            nickname: '',
            registerPageShow: false,
            registrationName: '',
            registrationPassword: '',
            registrationStatus: '',
            connectionStatus: 'Not Connected',
            connected: false,
            messages: [],
            message : '',
            recipient: '',
            onlineFriends: [],
            chatRooms: [],
            chatType: 'chat',
            roomParticipants: []
        };
        this.connectButtonPushed = this.connectButtonPushed.bind(this);
        this.jidHandleChange = this.jidHandleChange.bind(this);
        this.passHandleChange = this.passHandleChange.bind(this);
        this.onStatusChange = this.onStatusChange.bind(this);
        this.getNewMessage = this.getNewMessage.bind(this);
        this.messageHandleChange = this.messageHandleChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.registrationNameHandleChange = this.registrationNameHandleChange.bind(this);
        this.registrationPasswordHandleChange = this.registrationPasswordHandleChange.bind(this);
        }
    Strophe = Strophe;
    connection = new Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");
    MUC = Strophe.Strophe.MUC;
    $msg = Strophe.Strophe.$msg;
    $iq = Strophe.Strophe.$iq;
    $pres = Strophe.Strophe.$pres;
    width = {width: this.props.width? this.props.width : '500px'};
    mainColor = {
        backgroundColor: this.props.mainColor,
        color: this.props.textColor
    }
    secondaryColor = {
        backgroundColor: this.props.secondaryColor
    }

    onStatusChange = (status) =>{
        this.setState({connectionStatus: status});
    }

    onMessage = (message) =>{
        let to = message.getAttribute('to');
        let from = message.getAttribute('from');
        let type = message.getAttribute('type');
        let elems = message.getElementsByTagName('body');
        let body = this.Strophe.Strophe.getText(elems[0]);
        if(body != null){
            let name = from.substring(0, from.indexOf('@')); 
            let nick = from.substring(from.indexOf('/') +1, from.length);
            from = from.substring(0, from.indexOf('/'));
            let message = { 
                to: to,
                from: from, 
                type: type,
                name: name, 
                nick: nick, 
                message: body
            };
            this.getNewMessage(message);
        }
        return true;
    } 

    sendMessage = (to, message) =>{
        if(message){
            let msg = this.Strophe.$msg({
                to: to,
                from: this.state.jid,
                type: this.state.chatType
            }).c('body').t(message);
            this.connection.send(msg);
            let selfMessage = {
                to: to,
                from: this.state.jid,
                type: this.state.chatType,
                name: this.state.jid.substring(0, this.state.jid.indexOf('@')),
                message: message
            }
            if(selfMessage.type == 'chat'){
                this.getNewMessage(selfMessage);
            }
            this.setState({message : ''});
        }
    }
    
    setStatus = (status) =>{
        status = this.$pres().c('show').t(status);
        this.connection.send(status);
    }

    subscribePresence = (jid) =>{
        this.connection.send(this.$pres({
            to: jid,
            type: 'subscribe'
        }));
    }

    getPresence = (jid) =>{
        let check = this.$pres({
            type: 'probe',
            to: jid
        });
        this.connection.send(check);
    }

    getRoster = () =>{
        let iq = this.Strophe.$iq({
            type: 'get'
        }).c('query',{
            xmlns: 'jabber:iq:roster'
        });
        this.connection.sendIQ(iq, this.rosterCallback);
    }

    rosterCallback = (iq) =>{
        let results = iq.getElementsByTagName('item');
        let friendsList = [];
        for(let i = 0; i < results.length; i++){
            friendsList.push(results.item(i).attributes.getNamedItem('jid').value);
        }
        this.setState({ onlineFriends : friendsList})
    }

    onSubscriptionRequest = (stanza) =>{
        if(stanza.getAttribute('type') == 'subscribe'){
            let from = stanza.getAttribute('from');
            this.connection.send(this.$pres({
                to: from,
                type: 'subscribed'
            }))
        }
        return true;
    }

    listRooms = () =>{
        this.connection.send(this.Strophe.$pres());
        let iq = this.Strophe.$iq({
            from: this.state.jid,
            to: this.props.MUC,
            type: 'get'
        }).c('query',{
            xmlns: 'http://jabber.org/protocol/disco#items'
        });
        this.connection.sendIQ(iq, this.listRoomCallback);
    }

    registerNewUser = () =>{
        let iq = this.Strophe.$iq({
            type: 'set',
            username: this.state.registrationName,
            password: this.state.registrationPassword
        }).c('query',{
            xmlns: 'jabber:iq:register'
        });
        this.connection.sendIQ(iq, this.registrationCallback);
        this.toggleRegistration();
    }
    registrationCallback = (iq) =>{
        console.log("hi");
        console.log(iq);
    }
    onPresence = (presence) =>{
        let presenceType = presence.getAttribute('type');
        let from = presence.getAttribute('from');
        let show = presence.getAttribute('show');
        if(this.props.MUC && from && from.includes(this.props.MUC)){
            let nick = from.substring(from.indexOf('/') + 1, from.length);
            let roomParticipantsNew = this.state.roomParticipants;
            if(!roomParticipantsNew.includes(nick)){
                roomParticipantsNew.push(nick);
                this.setState({roomParticipants : roomParticipantsNew});
            }
        }
        return true;
    }

    onConnect = (status) =>{
        if(status == Strophe.Strophe.Status.CONNECTING){
            this.onStatusChange("Connecting");            
        }
        else if(status == Strophe.Strophe.Status.CONNFAIL){
            this.onStatusChange("Connection Failed, retrying.");
        }
        else if(status == Strophe.Strophe.Status.DISCONNECTING){
            this.onStatusChange("Disconnected");
        }
        else if(status == Strophe.Strophe.Status.CONNECTED){
            this.onStatusChange("Connected!");
            this.setState({connected : true})
            this.connection.addHandler(this.onMessage, null, 'message', null, null, null);
            this.connection.addHandler(this.onSubscriptionRequest, null, 'presence', 'subscribe');
            this.connection.addHandler(this.onPresence, null, 'presence');
            this.getRoster();
            this.listRooms();
        }
    }
    
    joinRoom = (room) =>{
        let to = room.jid + '/' + this.state.jid.substring(0, this.state.jid.indexOf('@'));
        let pres = this.Strophe.$pres({
            from: this.state.jid,
            to: to
        }).c('x', {
            xmlns: 'http://jabber.org/protocol/muc'
        });
        this.connection.send(pres);
        //When you join a room it gives you a short history of messages, so we should clear out the existing ones to not get duplicates
        let clearMessagesOfPreviousChat = this.state.messages;
        for(let i = 0; i < clearMessagesOfPreviousChat.length; i++){
            if(this.props.MUC && clearMessagesOfPreviousChat[i].from && clearMessagesOfPreviousChat[i].from.includes(this.props.MUC)){
                clearMessagesOfPreviousChat.splice(i);
            }
            this.setState({messages: clearMessagesOfPreviousChat});
        }
        this.setRecipient(room.jid, 'groupchat');
    }
    listRooms = () =>{
        this.connection.send(this.Strophe.$pres());
        let iq = this.Strophe.$iq({
            from: this.state.jid,
            to: this.props.MUC,
            type: 'get'
        }).c('query',{
            xmlns: 'http://jabber.org/protocol/disco#items'
        });
        this.connection.sendIQ(iq, this.listRoomCallback);
    }
    listRoomCallback = (iq) =>{
        let results = iq.getElementsByTagName('item');
        let roomList = [];
        for(let i = 0; i < results.length; i++){
            roomList.push( { 
                jid: results.item(i).attributes.getNamedItem('jid').value,
                name: results.item(i).attributes.getNamedItem('name').value
        });
        }
        this.setState({ chatRooms : roomList})
    }
    listRoomParticipantsCallback = (iq) =>{
        let results = iq.getElementsByTagName('item');
        let participants = [];
        for(let i = 0; i < results.length; i++){
            participants.push(results.item(i).attributes.getNamedItem('jid').value);
        }
        this.setState({roomParticipants: participants});
    }
    connectButtonPushed = () =>{
        this.connection.connect(this.state.jid, this.state.password, this.onConnect);
    }
    getNewMessage = (message) =>{
        let newMessages = this.state.messages.concat(message);
        this.setState({ messages : newMessages}, this.scrollToBottom)
    }
    setRecipient = (friend, chatType) =>{
        this.setState({
            recipient: friend,
            chatType: chatType
        });
    }
    jidHandleChange = (e) =>{
        this.setState({jid : e.target.value });
    }

    passHandleChange = (e) =>{
        this.setState({password : e.target.value });
    }
    registrationNameHandleChange = (e) =>{
        this.setState({registrationName: e.targe.value});
    }
    registrationPasswordHandleChange = (e) =>{
        this.setState({registrationPassword: e.target.value});
    }
    toggleRegistration = () =>{
        let show = !this.state.registerPageShow;
        this.setState({registerPageShow: show})
    }
    messageHandleChange = (e) =>{
        this.setState({message : e.target.value });
    }
    handleKeyPress(event) {
        if(event.key == 'Enter'){
          this.sendMessage(this.state.recipient, this.state.message);
          this.setState({message: ''});
        } 
    }
    scrollToBottom() {
        animateScroll.scrollToBottom({
        containerId: "messages"
        });
    }
    render() {
    return (
        <div className="container" style={this.width}>
            {/* Before connected */}
            {this.state.connected == false && !this.state.registerPageShow &&
                <div className='login-box' style={this.mainColor}>
                    <span>{this.props.chatName ? this.props.chatName : 'Chat'}</span>
                    <label>JID: </label>
                    <input onChange={this.jidHandleChange} type="text"></input>
                    <br></br>
                    <label>Password: </label>
                    <input onChange={this.passHandleChange} type="password"></input>
                    <br/>
                    <button style={this.secondaryColor} onClick={this.connectButtonPushed}>Log on</button>
                    <button style={this.secondaryColor} onClick={this.toggleRegistration}>Register</button>
                </div>
            }
                {this.state.registerPageShow &&
                <div>
                    <span>Registration</span><br/>
                    <label>Username: </label>
                    <input type='text' onChange={ () => this.registrationNameHandleChange}></input><br/>
                    <label>Password: </label>
                    <input type='password' onChange={ ()=> this.registrationPasswordHandleChange}></input><br/>
                    <button style={this.secondaryColor} onClick={ ()=> this.registerNewUser() }>Submit</button>
                </div>
                }
            {/* Once connected */}
            <div>
            {this.state.connected && 
            <div className="chat-window" style={this.mainColor}>
                <div className="friends-list">
                    <div>
                        <span>{this.state.connectionStatus}</span>
                    </div>
                    <div>
                        <span>Friends:</span>
                        {this.state.onlineFriends && this.state.onlineFriends.map( (friend) =>
                            <button style={this.secondaryColor} key={friend} onClick={() => this.setRecipient(friend, 'chat')}>{friend.substring(0, friend.indexOf('@')) }</button>
                        )}
                    </div>
                    <div>
                        <span>Rooms:</span>
                        {this.state.chatRooms && this.state.chatRooms.map( (room, index) =>
                            <button style={this.secondaryColor} key={room.name+index} onClick={() => this.joinRoom(room)}>{room.name}</button>
                        )}
                    </div>
                    <div >
                        <span>Participants:</span>
                        {this.state.chatType == 'groupchat' && this.state.roomParticipants.map( (participant, index) =>
                            <span key={participant+index}>{participant}</span>
                        )}
                    </div>
                </div>
                <div className="chat-area" style={this.mainColor}>
                        {this.state.recipient ? this.state.recipient.substring(0, this.state.recipient.indexOf('@')) : "Messages"}
                        <div id='messages' className="message-box">
                            {this.state.messages && this.state.messages.map( (message, index) => ( 
                                message.from == this.state.recipient  && message.type == 'groupchat' &&
                                <span className='message' key={message.name + index}>{message.type == 'groupchat' ? message.nick : message.name}: {message.message}</span>
                            ))}
                            {this.state.messages && this.state.messages.map( (message, index) => ( 
                                (message.from == this.state.recipient || message.to == this.state.recipient) &&
                                <span className='message' key={message.name + index}>{message.name}: {message.message}</span>
                            ))}
                        </div>
                    <div className="text-area">
                        <input value={this.state.message} onChange={this.messageHandleChange} onKeyPress={ this.handleKeyPress} ref='messageInput' type="textarea"></input>
                        <button style={this.secondaryColor} onClick={ () => this.sendMessage(this.state.recipient, this.state.message)} >Send</button>
                    </div>
                </div>
            </div>
            }
            </div>
        </div>
    );
    }
}

export default XMPP;