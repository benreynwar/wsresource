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
        return data

    def update(self, data):
        if 'color' in data:
            self.color = data['color']
        if 'position' in data:
            self.position = data['position']
        if 'radius' in data:
            self.radius = data['radius']

if __name__ == '__main__':
    ws_address = 'ws://localhost:9407'
    repositories = {}
    def register_repository(repository):
        repositories[repository.resource] = repository
    factory = protocol.WSResourceRepoSideV1Factory(
        repositories,
        ws_address, debug = False,
        debugCodePaths = False)
    factory.protocol = protocol.WSResourceRepoSideV1Protocol
    factory.setProtocolOptions(allowHixie76 = True)

    circle_resource = 'circle'
    circle_repository = protocol.Repository(circle_resource, Circle, factory)
    repositories[circle_resource] = circle_repository

    listenWS(factory)
    reactor.run()

