define(
  ['console', 'q'],
  function(console, Q) {

    var Protocol = function(ws_address) {
      var _this = this;
      this._ws_address = ws_address;
      this._connection = new WebSocket(ws_address);
      console.log('trying to open connection to ' + ws_address);
      console.log(this._connection);
      this._connection.binaryType = 'arraybuffer';
      this._connection.onmessage = function (e) {
        if (e.data instanceof ArrayBuffer) {
          _this._onBinaryMessage(e.data);
        } else {
          _this._onJsonMessage(e.data);
        }
      };
      this._connection.onopen = this._onOpenConnection.bind(this);
      this._connection.onclose = this._onCloseConnection.bind(this);
      this._requestIdCounter = 0;
      this._waitingFor = {};
      this._queue = [];
    };
    
    Protocol.Action = function(resource, action, data) {
      console.log('making new action');
      this.protocol = 'wsresource'
      this.messageType = 'action'
      this.resource = resource;
      this.action = action;
      this.data = data;
      this.requestId = null;
    }

    Protocol.ActionResponse = function(message) {
      this._respondingTo = message.respondingTo;
      this.status = message.status;
      this.message = message.message;
      this.data = message.data;
    };

    // Private Methods
    Protocol.prototype._onJsonMessage = function(msg) {
      var message = JSON.parse(msg); 
      console.log('got a message');
      console.log(message);
      var protocol = message.protocol
      if (protocol == 'wsresource') {
        var messageType = message.messageType;
        if (messageType == 'actionresponse') {
          this._onActionResponse(message);
        } else {
          console.log('Unknown message type: ' + messageType);
        }
      } else {
        console.log('Unknown protocol: ' + protocol);
      }
    };
    
    Protocol.prototype._onActionResponse = function(message) {
      var actionResponse = new Protocol.ActionResponse(message);
      if (actionResponse._respondingTo in this._waitingFor) {
        var deferred = this._waitingFor[actionResponse._respondingTo];
        console.log('action response is');
        console.log(actionResponse);
        console.log('deferred is');
        console.log(deferred);
        if (deferred) {
          if (actionResponse.status === 'ok') {
            console.log('resolving action response');
            deferred.resolve(actionResponse);
          } else {
            deferred.reject(actionResponse);
          }
        }
      }
    }

    Protocol.prototype._onBinaryMessage = function(msg) {
      console.log('This server does not support binary messages');
    };

    Protocol.prototype._getRequestId = function() {
      var id = this._requestIdCounter;
      this._requestIdCounter += 1;
      return id;
    };

    Protocol.prototype._trySendMessage = function(message) {
      console.log('trying to send message status is ' + this._connection.readyState);
      var OPEN = 1;
      if (this._connection.readyState !== OPEN) {
        this._queue.push(message);
      } else {
        this._sendMessage(message);
      }
    };
    Protocol.prototype._onOpenConnection = function() {
      console.log('connection is open');
      while (this._queue.length > 0) {
        var message = this._queue.pop();
        this._sendMessage(message);
      }
    };
    Protocol.prototype._onCloseConnection = function(event) {
      console.log('connection is closed');
      console.log(event);
    };
    Protocol.prototype._sendMessage = function(message) {
      console.log('really sending a message');
      console.log(message);
      var result = this._connection.send(message);
      console.log(result);
    }

    // Public Methods
    Protocol.prototype.sendAction = function(action) {
      console.log('send action');
      var _this = this;
      var deferred = Q.defer();
      action.requestId = this._getRequestId();
      var jsonified = JSON.stringify(action);
      console.log('request id is ' + action.requestId);
      this._waitingFor[action.requestId] = deferred;
      this._trySendMessage(jsonified);
      return deferred.promise;
    };

    return Protocol;
    
  });
