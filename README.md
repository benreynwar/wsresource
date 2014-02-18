wsresource
==========

RESTish + subscribe interface to server-side data repositories

Server side is implemented in python using twisted/autobahn.  demo/server.py will run a demo server.

demo/demo.html will run the demo client.

I'm trying to replicate the functionality of a RESTful api, but adding on the option of subscribing to resources.

Web sockets are being used for everything, since we need to push to the client for the subscribe functionality.

When subscribing to the resource, the value is returned in a response, however unlike a traditional GET request, the value
is kept synced with the value on the server.

It's nowhere near ready to use yet, and not even properly thought through.
