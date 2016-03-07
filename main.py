#!/usr/bin/env python

import webapp2
from webapp2_extras import routes
import handler

class MainHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write('Hello world!')

app = webapp2.WSGIApplication([
    routes.DomainRoute('fukidashi-talk.appspot.com', [
        routes.RedirectRoute('/', redirect_to='http://fukidashi-talk.otchy.net', schemes=['http'])
    ]),
    ('/', handler.IndexHandler)
], debug=True)
