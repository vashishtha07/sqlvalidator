import unittest
import json
from backend.main import app

class SQLValidatorTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def post_sql(self, sql):
        return self.app.post('/validate',
                             data=json.dumps({'sql': sql}),
                             content_type='application/json')

    def test_valid_sql(self):
        response = self.post_sql('SELECT name FROM employees;')
        data = json.loads(response.data)
        self.assertTrue(data['valid'])
        self.assertEqual(data['errors'], [])

    def test_invalid_syntax(self):
        response = self.post_sql('SELEC name FROM employees;')
        data = json.loads(response.data)
        self.assertFalse(data['valid'])
        self.assertTrue(any('syntax' in e['message'].lower() or 'unparsable' in e['message'].lower() for e in data['errors']))

    def test_trailing_comma(self):
        response = self.post_sql('SELECT name, FROM employees;')
        data = json.loads(response.data)
        self.assertFalse(data['valid'])
        self.assertTrue(any('comma' in e['message'].lower() for e in data['errors']))

    def test_missing_from(self):
        response = self.post_sql('SELECT name')
        data = json.loads(response.data)
        self.assertFalse(data['valid'])
        self.assertTrue(any('from' in e['message'].lower() for e in data['errors']))

    def test_invalid_function(self):
        response = self.post_sql('SELECT mx(name) FROM employees;')
        data = json.loads(response.data)
        self.assertFalse(data['valid'])
        self.assertTrue(any('not a recognized sql function' in e['message'].lower() for e in data['errors']))

if __name__ == '__main__':
    unittest.main()
