define(
  ['console', 'q'],
  function(console, Q) {

    var Protocol = function(ws_address, repositories, binaryMessageHandler) {
      var _this = this;
      this._ws_address = ws_address;
      this._connection = new WebSocket(ws_address);
      this._connection.binaryType = 'arraybuffer';
      this._connection.onmessage = function (e) {
        if (e.data instanceof ArrayBuffer) {
          _this._onBinaryMessage(e.data);
        } else {
          _this._onJsonMessage(e.data);
        }
      };
      this._binaryMessageHandler = binaryMessageHandler;
      this._connection.onopen = this._onOpenConnection.bind(this);
      this._connection.onclose = this._onCloseConnection.bind(this);
      this._requestIdCounter = 0;
      this._waitingFor = {};
      this._queue = [];
      this._repositories = repositories;
    };

    Protocol.Action = function(resource, action, data) {
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

    Protocol.ActionReport = function(message) {
      this.action = message.action;
      this.resource = message.resource;
      this.data = message.data;
    };

    // Private Methods
    Protocol.prototype._onJsonMessage = function(msg) {
      var message = JSON.parse(msg); 
      var protocol = message.protocol
      if (protocol == 'wsresource') {
        var messageType = message.messageType;
        if (messageType == 'actionresponse') {
          this._onActionResponse(message);
        } else if (messageType == 'actionreport') {
          this._onActionReport(message);
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
        if (deferred) {
          if (actionResponse.status === 'ok') {
            deferred.resolve(actionResponse);
          } else {
            deferred.reject(actionResponse);
          }
        }
      }
    };

    Protocol.prototype._onActionReport = function(message) {
      var actionReport = new Protocol.ActionReport(message);
      var repoName = actionReport.resource.split('/')[0];
      if (repoName in this._repositories) {
        var repo = this._repositories[repoName];
        repo.processActionReport(actionReport);
      }
    };

    Protocol.prototype._onBinaryMessage = function(msg) {
      if (!this.binaryMessageHandler) {
        console.log('This server does not support binary messages');
      } else {
        this.binaryMessageHandler(msg);
      }
    };

    Protocol.prototype._getRequestId = function() {
      var id = this._requestIdCounter;
      this._requestIdCounter += 1;
      return id;
    };

    Protocol.prototype._trySendMessage = function(message) {
      var OPEN = 1;
      if (this._connection.readyState !== OPEN) {
        this._queue.push(message);
      } else {
        this._sendMessage(message);
      }
    };
    Protocol.prototype._onOpenConnection = function() {
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
      var result = this._connection.send(message);
    }

    // Public Methods
    Protocol.prototype.sendAction = function(action) {
      var _this = this;
      var deferred = Q.defer();
      action.requestId = this._getRequestId();
      var jsonified = JSON.stringify(action);
      this._waitingFor[action.requestId] = deferred;
      this._trySendMessage(jsonified);
      return deferred.promise;
    };

    return Protocol;
    
  });
