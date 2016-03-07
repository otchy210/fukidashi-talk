import os
import webapp2
import jinja2

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True
)

class BaseHandler(webapp2.RequestHandler):
    def render(self, path, values={}):
        template = JINJA_ENVIRONMENT.get_template(path)
        self.response.write(template.render(values))

class IndexHandler(BaseHandler):
    def get(self):
        self.render("index.html")
