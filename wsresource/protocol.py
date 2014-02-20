import json

from twisted.internet import reactor
from autobahn.twisted import websocket

# Item Interface
# constructor(data)
# to_json()
# update(data)


class Repository(object):
    
    def __init__(self, resource, ItemClass, factory):
        self.resource = resource
        self.factory = factory
        self.ItemClass = ItemClass
        self.next_id = 0
        self.items = {}
        self.listeners = {
            'all': set([]),
        }

    def get_new_id(self):
        ident = self.next_id
        self.next_id += 1
        return ident

    def get_listeners(self, ident):
        specific_listeners = self.listeners.get(ident, set([]))
        generic_listeners = self.listeners.get('all', set([]))
        listeners = specific_listeners | generic_listeners
        return listeners

    def add(self, data):
        data['id'] = self.get_new_id()
        data['resource'] = self.resource + '/' + str(data['id'])
        self.items[data['id']] = self.ItemClass(data)
        self.report_add(data)
        return data

    def report_add(self, data):
        action_report = ActionReport(
            action='add',
            data=data,
            resource=data['resource'])
        listeners = self.get_listeners(data['id'])
        self.factory.send_action_report(action_report, listeners)

    def read(self, ident):
        value = None
        if (ident in self.items):
            value = self.items[ident]
        return value

    def read_collection(self, name):
        items = []
        if (name == 'all'):
            items = self.items.values()
        return items

    def subscribe(self, ident, subscriber_id):
        if (ident not in self.listeners):
            self.listeners[ident] = set([])
        self.listeners[ident].add(subscriber_id)
    
    def update(self, ident, data):
        value = self.read(ident)
        if value is not None:
            value.update(data)
            self.report_update(data)
        return value

    def report_update(self, data):
        action_report = ActionReport(
            action='update',
            data=data,
            resource=data['resource'])
        listeners = self.get_listeners(data['id'])
        self.factory.send_action_report(action_report, listeners)

    def delete(self, ident):
        deleted = False
        item = self.read(ident)
        if item is not None:
            del self.items[ident]
            self.report_delete(item)
            deleted = True
        return deleted
        
    def report_delete(self, item):
        action_report = ActionReport(
            action='delete',
            data=None,
            resource=item.resource)
        listeners = self.get_listeners(item.id)
        self.factory.send_action_report(action_report, listeners)


class Action(object):

    def __init__(self, message, repositories, client_id):
        self.repositories = repositories
        self.client_id = client_id
        self.action = message.get('action', None)
        self.resource = message.get('resource', None)
        self.request_id = message.get('requestId', None)
        self.data = message.get('data', None)

    def to_json(self):
        data = {
            'protocol': 'wsresource',
            'messageType': 'action',
            'resource': self.resource,
            'requestId': self.request_id,
            'data': self.data,
        }
        return data

    def process(self):
        bits = self.resource.split('/')
        repository_resource = bits[0]
        if len(bits) > 1:
            try:
                ident = int(bits[1])
            except ValueError:
                ident = None
        else:
            ident = None
        repository_resource = self.resource.split('/')[0]

        if (repository_resource in self.repositories):
            repository = self.repositories[repository_resource]
            if (self.action == 'add'):
                self.data = repository.add(self.data)
                response = self.create_action_response(
                    status='ok', message='', data=self.data)
            elif (self.action == 'subscribe'):
                items = repository.read_collection('all')
                jsonified = [item.to_json() for item in items]
                repository.subscribe('all', self.client_id)
                response = self.create_action_response(
                    status='ok', message='', data=jsonified)
            elif (self.action == 'delete'):
                success = repository.delete(ident)
                if success:
                    response = self.create_action_response(
                        status='ok', message='', data=None)
                else:
                    response = self.create_action_response(
                        status='error', message='failed to delete', data=None)
            elif (self.action == 'update'):
                item = repository.update(ident, self.data)
                if item:
                    response = self.create_action_response(
                        status='ok', message='', data=item.to_json())
                else:
                    response = self.create_action_resopnse(
                        status='error', message='Could not find item to update',
                        data=None)
            else:
                response = self.create_action_response(
                    status='error',
                    message='unknown action: {0}'.format(self.action), data=None)
        else:
            response = self.create_action_response(
                status='error', message='unknown resource', data=None)
        return response

    def create_action_response(self, status, message, data):
        response = ActionResponse(
            self.resource, self.request_id, status, message, data)
        return response


class ActionReport(object):
    
    def __init__(self, resource, action, data):
        self.resource = resource
        self.action = action
        self.data = data

    def to_json(self):
        data = {
            'protocol': 'wsresource',
            'messageType': 'actionreport',
            'resource': self.resource,
            'action': self.action,
            'data': self.data,
        }
        return data


class ActionResponse(object):

    def __init__(self, resource, responding_to, status, message, data):
        self.resource = resource
        self.responding_to = responding_to
        self.status = status
        self.message = message
        self.data = data

    def to_json(self):
        data = {
            'protocol': 'wsresource',
            'messageType': 'actionresponse',
            'resource': self.resource,
            'respondingTo': self.responding_to,
            'message': self.message,
            'status': self.status,
            'data': self.data,
        }
        return data
        

class WSResourceClientSideV1Protocol(websocket.WebSocketClientProtocol):
    
    def __init__(self):
        self._request_id_counter = 0

    def _on_json_message(msg):
        pass

    def _on_action_response(action_response):
        pass
        
    def _on_action_report(action_report):
        pass

    def _get_request_id():
        ident = self._request_id_counter
        self._request_id_counter += 1
        return ident

    def _try_send_message(message):
        pass

    def _on_open_connection():
        pass

    def _on_close_connection():
        pass

    def _send_message():
        pass

    def send_action(action):
        action.request_id = self._get_request_id()
        jsonified = json.dumps(action.to_json())
        this._try_send_message(jsonified)
    

class WSResourceRepoSideV1Protocol(websocket.WebSocketServerProtocol):

    def __init__(self, *args, **kwargs):
        self._id_counter = 0
        self.repositories = {}
        self.id = None

    def set_repositories(self, repositories):
        self.repositories = repositories

    def set_id(self, ident):
        self.id = ident

    def get_id(self):
        new_id = self._id_counter
        self._id_counter += 1
        return new_id

    def onConnect(self, request):
        print("Client connecting: {}".format(request.peer))

    def onOpen(self):
        print('opening socket')
        self.factory.register(self)
        print('finished opening');
        
    def onMessage(self, msg, binary):
        print('got a message')
        print(msg)
        message = json.loads(msg)
        protocol = message.get('protocol', '')
        if protocol == 'wsresource':
            self.onWSResourceMessage(message)
        else:
            print('Unknown protocol: ' + protocol)

    def onWSResourceMessage(self, message):
        message_type = message.get('messageType', '')
        if message_type == 'action':
            action = Action(message, self.repositories, self.id)
            response = action.process()
            jsonified = json.dumps(response.to_json())
            print('sending a message: ' + jsonified)
            self.sendMessage(jsonified)
        else:
            print('Unknown message type: ' + message_type)        

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))

    def connectionLost(self, reason):
        websocket.WebSocketServerProtocol.connectionLost(self, reason)
        self.factory.unregister(self)


class WSResourceRepoSideV1Factory(websocket.WebSocketServerFactory):

    def __init__(self, repositories, url, debug = False, debugCodePaths = False):
        websocket.WebSocketServerFactory.__init__(
            self, url, debug = debug, debugCodePaths = debugCodePaths)
        self.next_client_id = 0
        self.clients = {}
        self.repositories = repositories
       
    def get_client_id(self):
        next_id = self.next_client_id
        self.next_client_id += 1
        return next_id

    def register(self, client):
        if not client in self.clients.values():
            client.set_repositories(self.repositories)
            client_id = self.get_client_id()
            client.set_id(client_id)
            self.clients[client_id] = client

    def unregister(self, client):
        if client in self.clients:
            del self.clients[client.id]

    def broadcast(self, msg):
        for c in self.clients:
            c.sendMessage(msg)

    def send_action_report(self, action_report, listeners):
        for listener_id in listeners:
            client = self.clients.get(listener_id, None)
            if client is not None:
                jsonified = json.dumps(action_report.to_json())
                client.sendMessage(jsonified)

