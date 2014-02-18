from twisted.internet import reactor
from autobahn.twisted.websocket import listenWS

try:
    from wsresource import protocol
except ImportError:
    import sys
    sys.path.append("..")
    from wsresource import protocol

class Circle(object):

    def __init__(self, data):
        print("**************** making a circle")
        self.id = data.get('id', None)
        self.resource = data.get('resource', None)
        self.color = data.get('color', None)
        self.position = data.get('position', None)
        self.radius = data.get('radius', None)

    def to_json(self):
        data = {'id': self.id,
                'color': self.color,
                'resource': self.resource,
                'position': self.position,
                'radius': self.radius
        }
        print('circle data in json will be {0} &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&'.format(data))
        return data

repositories = {}
def register_repository(repository):
    repositories[repository.resource] = repository

if __name__ == '__main__':
    ws_address = 'ws://localhost:9407'
    factory = protocol.WSResourceV1Factory(
        repositories,
        ws_address, debug = False,
        debugCodePaths = False)
    factory.protocol = protocol.WSResourceV1Protocol
    factory.setProtocolOptions(allowHixie76 = True)

    circle_repository = protocol.Repository('circle', Circle, factory)
    register_repository(circle_repository)

    listenWS(factory)
    reactor.run()

