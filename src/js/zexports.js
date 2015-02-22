
var e = (typeof window !== 'undefined' ? window : exports);

e.authorizations = authorizations = new SwaggerAuthorizations();
e.ApiKeyAuthorization = ApiKeyAuthorization;
e.PasswordAuthorization = PasswordAuthorization;
e.CookieAuthorization = CookieAuthorization;
e.SwaggerClient = SwaggerClient;
e.SwaggerApi = SwaggerClient;
e.Operation = Operation;
e.Model = Model;
e.addModel = addModel;
e.Resolver = Resolver;