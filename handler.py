import os
import webapp2
import jinja2

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True,
    variable_start_string='[[',
    variable_end_string=']]'
)

class BaseHandler(webapp2.RequestHandler):
    def render(self, path, values={}):
        template = JINJA_ENVIRONMENT.get_template(path)
        self.response.write(template.render(values))

class IndexHandler(BaseHandler):
    def get(self):
        if self.request.get('cdn'):
            cdn = self.request.get('cdn') in ['True', 'true', '1']
        else:
            cdn = True
        self.render("index.html", {'cdn': cdn})

class SampleHandler(BaseHandler):
    def get(self):
        if self.request.get('cdn'):
            cdn = self.request.get('cdn') in ['True', 'true', '1']
        else:
            cdn = True
        self.render("sample.html", {'cdn': cdn})
