
var e = (typeof window !== 'undefined' ? window : exports);

e.authorizations = new SwaggerAuthorizations();
e.ApiKeyAuthorization = ApiKeyAuthorization;
e.PasswordAuthorization = PasswordAuthorization;
e.CookieAuthorization = CookieAuthorization;
e.SwaggerClient = SwaggerClient;
e.Operation = Operation;
e.Model = Model;
e.models = models;