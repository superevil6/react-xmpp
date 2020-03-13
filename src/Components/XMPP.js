import React from 'react';
import {Strophe} from 'node-strophe';
import {animateScroll} from 'react-scroll';
import './XMPP.css';
import './strophejs-plugin-register';
class XMPP extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            jid: '',
            password: '',
            nickname: '',
            registerPageShow: false,
            registrationName: '',
            registrationPassword: '',
            registrationPasswordConfirm: '',
            registrationStatus: '',
            friendToAdd: '',
            friendRequest: '',
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
        this.registrationPasswordConfirmationHandleChange = this.registrationPasswordConfirmationHandleChange.bind(this);
        this.addFriendHandleChange = this.addFriendHandleChange.bind(this);
        }
    Strophe = Strophe;
    $msg = Strophe.Strophe.$msg;
    $iq = Strophe.Strophe.$iq;
    $pres = Strophe.Strophe.$pres;
    width = {width: this.props.width? this.props.width : '400px'};
    height = {height: this.props.height? this.props.height: '400px'};
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
            let name;
            if(type === 'groupchat'){
                name = from.substring(from.indexOf('/') + 1, from.length); 
            }
            if(type === 'chat'){
                name = from.substring(0, from.indexOf('@')); 
            }
            from = from.substring(0, from.indexOf('/'));
            let message = { 
                to: to,
                from: from, 
                type: type,
                name: name, 
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
            if(selfMessage.type === 'chat'){
                this.getNewMessage(selfMessage);
            }
            this.setState({message : ''});
        }
    }
    
    subscribePresence = (jid) =>{
        this.connection.send(this.Strophe.$pres({
            to: jid,
            type: 'subscribe'
        }));
        this.setState({friendToAdd : '', friendRequest : ''});
    }

    getPresence = (jid) =>{
        let check = this.Strophe.$pres({
            type: 'probe',
            to: jid,
            from: this.state.jid
        });
        this.connection.send(check);
    }

    getRoster = () =>{
        let iq = this.Strophe.$iq({
            type: 'get'
        }).c('query',{
            xmlns: 'jabber:iq:roster'
        });
        this.connection.sendIQ(iq);
    }


    onSubscriptionRequest = (stanza) =>{
        if(stanza.getAttribute('type') === 'subscribe'){
            let from = stanza.getAttribute('from');
            this.connection.send(this.Strophe.$pres({
                to: from,
                type: 'subscribed'
            }))
            this.setState({friendRequest : from});
        }
        return true;
    }

    registerNewUser = () =>{
        this.connection = new this.Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");
        if(this.state.registrationPassword === this.state.registrationPasswordConfirm){
            this.connection.register.connect(this.props.domain, this.registerCallback);
        }
        else{
            this.setState({registrationStatus : 'Password mismatch'});
        }
    }
    registerCallback = (status) => {
        if (status === this.Strophe.Strophe.Status.REGISTER) {
            this.connection.register.fields.username = this.state.registrationName;
            this.connection.register.fields.password = this.state.registrationPassword;
            this.connection.register.submit();
        } 
        else if (status === this.Strophe.Strophe.Status.REGISTERED) {
            this.connection = new this.Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");
            this.setState({registrationStatus: 'Registered!', registerPageShow : false} );

        } 
        else if (status === this.Strophe.Strophe.Status.CONFLICT) {
            this.setState({registrationStatus: 'Username is taken.'});
        } 
        else if (status === this.Strophe.Strophe.Status.NOTACCEPTABLE) {
            this.setState({registrationStatus: 'Information invalid.'});
        } 
        else if (status === this.Strophe.Strophe.Status.REGIFAIL) {
            this.setState({registrationStatus: 'Registration not supported.'});
        } 
        else if (status === this.Strophe.Strophe.Status.SBMTFAIL) {
            this.setState({registrationStatus: 'Username already in Use.'});
        }
    };
    
    onPresence = (presence) =>{
        let from = presence.getAttribute('from');
        if(this.props.MUC && from && from.includes(this.props.MUC)){
            let nick = from.substring(from.indexOf('/') + 1, from.length);
            let roomParticipantsNew = this.state.roomParticipants;
            if(!roomParticipantsNew.includes(nick)){
                roomParticipantsNew.push(nick);
                this.setState({roomParticipants : roomParticipantsNew});
            }
        }
        if(from.includes('/') && !from.includes(this.state.jid) && !from.includes(this.props.MUC)){
            let nick = from.substring(0, from.indexOf('@'));
            let onlineFriendsNew = this.state.onlineFriends;
            let alreadyInList = false;
            for(let i = 0; i < this.state.onlineFriends.length; i++){
                if(this.state.onlineFriends[i].name == nick){
                    alreadyInList = true;
                }
            }
            if(!alreadyInList){
                onlineFriendsNew.push( {name: nick, jid : from});
                this.setState({onlineFriends : onlineFriendsNew});
            }
        }
        return true;
    }

    onConnect = (status) =>{
        if(status === Strophe.Strophe.Status.CONNECTING){
            this.onStatusChange("Connecting");            
        }
        else if(status === Strophe.Strophe.Status.CONNFAIL){
            this.onStatusChange("Connection Failed, retrying.");
        }
        else if(status === Strophe.Strophe.Status.DISCONNECTING){
            this.onStatusChange("Disconnecting");
        }
        else if(status === Strophe.Strophe.Status.DISCONNECTED){
            this.onStatusChange("Disconnected");
        }
        else if(status === Strophe.Strophe.Status.AUTHENTICATING){
            this.onStatusChange("Authenticating.");
        }
        else if(status === Strophe.Strophe.Status.AUTHFAIL){
            this.onStatusChange("Incorrect username or password.");
            this.connection = new this.Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");

        }
        else if(status === Strophe.Strophe.Status.CONNECTED){
            this.onStatusChange("Connected!");
            this.setState({connected : true})
            this.connection.addHandler(this.onMessage, null, 'message', null, null, null);
            this.connection.addHandler(this.onSubscriptionRequest, null, 'presence', 'subscribe');
            this.connection.addHandler(this.onPresence, null, 'presence');
            this.getRoster();
            this.listRooms();
        }
        else{
            this.onStatusChange("Unable to connect.");
            this.connection = new this.Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");

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

    connectButtonPushed = () =>{
        if(this.state.jid && this.state.password){
            this.connection = new this.Strophe.Strophe.Connection(this.props.server, "KEEPALIVE");
            this.connection.connect(this.state.jid, this.state.password, this.onConnect);
        }
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
        this.setState({jid : e.target.value + '@' + this.props.domain});
    }

    passHandleChange = (e) =>{
        this.setState({password : e.target.value });
    }
    registrationNameHandleChange = (e) =>{
        this.setState({registrationName: e.target.value});
    }
    registrationPasswordHandleChange = (e) =>{
        this.setState({registrationPassword: e.target.value});
    }
    registrationPasswordConfirmationHandleChange = (e) =>{
        this.setState({registrationPasswordConfirm: e.target.value});
    }
    toggleRegistration = () =>{
        let show = !this.state.registerPageShow;
        this.setState({registerPageShow: show})
    }
    messageHandleChange = (e) =>{
        this.setState({message : e.target.value });
    }
    handleKeyPress = (event) => {
        if(event.key === 'Enter'){
          this.sendMessage(this.state.recipient, this.state.message);
          this.setState({message: ''});
        } 
    }
    addFriendHandleChange = (e) =>{
        this.setState({ friendToAdd : e.target.value + '@' + this.props.domain })
    }
    rejectFriend =() =>{
        let friendRequest = '';
        this.setState({friendRequest : friendRequest});
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
            {this.state.connected === false && !this.state.registerPageShow &&
                <div className='login-box' style={this.mainColor}>
                    <span>{this.props.chatName ? this.props.chatName : 'Chat'}</span>
                    <label>Username: </label>
                    <input onChange={this.jidHandleChange} type="text"></input>
                    <br/>
                    <label>Password: </label>
                    <input onChange={this.passHandleChange} type="password"></input>
                    <br/>
                    <button style={this.secondaryColor} onClick={this.connectButtonPushed}>Log on</button>
                    <button style={this.secondaryColor} onClick={this.toggleRegistration}>Register</button>
                    {this.state.connectionStatus}
                </div>
            }
                {this.state.registerPageShow &&
                <div className='login-box' style={this.mainColor}>
                    <span>Registration</span><br/>
                    <label>Username: </label>
                    <input type='text' onChange={this.registrationNameHandleChange}></input><br/>
                    <label>Password: </label>
                    <input type='password' onChange={this.registrationPasswordHandleChange}></input><br/>
                    <label>Confirm Password:</label>
                    <input type='password' onChange={this.registrationPasswordConfirmationHandleChange}></input>
                    <br/>
                    {this.state.registrationStatus}
                    <br/>
                    <button style={this.secondaryColor} onClick={ ()=> this.registerNewUser() }>Submit</button>
                    <button style={this.secondaryColor} onClick={ ()=> this.toggleRegistration() }>Back</button>
                </div>
                }
            {/* Once connected */}
            <div>
            {this.state.connected && 
            <div className="chat-window" style={this.mainColor}>
                <div className="side-bar">
                    <div> 
                        <div>
                            <span>{this.state.connectionStatus}</span>
                        </div>
                        <div>
                            <span>Online:</span>
                            {this.state.onlineFriends && this.state.onlineFriends.map( (friend, index) =>
                                <button style={this.secondaryColor} key={index} onClick={() => this.setRecipient(friend.jid, 'chat')}>{friend.name}</button>
                            )}
                        </div>
                        <div>
                            <span>Rooms:</span>
                            {this.state.chatRooms && this.state.chatRooms.map( (room, index) =>
                                <button style={this.secondaryColor} key={room.name+index} onClick={() => this.joinRoom(room)}>{room.name}</button>
                            )}
                        </div>
                        {this.state.roomParticipants && this.state.chatType === 'groupchat' &&
                            <div >
                                <span>Participants:</span>
                                {this.state.chatType === 'groupchat' && this.state.roomParticipants.map( (participant, index) =>
                                    <span key={participant+index}>{participant}</span>
                                )}
                            </div>
                        }

                    </div>
                    {this.state.friendRequest && 
                        <div>
                            <label>{this.state.friendRequest}</label>
                            <span>Wishes to be your friend</span>
                            <button style={this.secondaryColor } onClick={ () => this.subscribePresence(this.state.friendToAdd)}>Add</button>
                            <button style={this.secondaryColor} onClick={ () => this.rejectFriend}>Reject</button>
                        </div>
                    }
                    <div>
                        <span>Add Contact:</span>
                        <input type='text' value={this.state.friendToAdd} onChange={this.addFriendHandleChange}></input>
                        <button style={this.secondaryColor} onClick={ () => this.subscribePresence(this.state.friendToAdd)}>Add</button>
                    </div>
                </div>
                <div className="chat-area" style={this.mainColor}>
                        {this.state.recipient ? this.state.recipient.substring(0, this.state.recipient.indexOf('@')) : "Messages"}
                        <div id='messages' className="message-box" style={this.height}>
                            {this.state.messages && this.state.messages.map( (message, index) => ( 
                                (message.from === this.state.recipient || message.to === this.state.recipient) &&
                                <span className='message' key={message.name + index}>{message.name}: {message.message}</span>
                            ))}
                        </div>
                    <div className="text-area">
                        <input value={this.state.message} onChange={this.messageHandleChange} onKeyPress={ this.handleKeyPress} ref='messageInput' type="textarea"></input>
                        <button style={this.secondaryColor} onClick={ () => this.sendMessage(this.state.recipient, this.state.message)}>Send</button>
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