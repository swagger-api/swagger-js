
var e = (typeof window !== 'undefined' ? window : exports);

e.authorizations = new SwaggerAuthorizations();
e.ApiKeyAuthorization = ApiKeyAuthorization;
e.PasswordAuthorization = PasswordAuthorization;
e.CookieAuthorization = CookieAuthorization;
e.SwaggerClient = SwaggerClient;
e.Operation = Operation;

// 1.x compat
// e.SampleModels = sampleModels;
// e.SwaggerHttp = SwaggerHttp;
// e.SwaggerRequest = SwaggerRequest;
// e.SwaggerAuthorizations = SwaggerAuthorizations;
// e.authorizations = new SwaggerAuthorizations();
// e.ApiKeyAuthorization = ApiKeyAuthorization;
// e.PasswordAuthorization = PasswordAuthorization;
// e.CookieAuthorization = CookieAuthorization;
// e.JQueryHttpClient = JQueryHttpClient;
// e.ShredHttpClient = ShredHttpClient;
// e.SwaggerOperation = SwaggerOperation;
// e.SwaggerModel = SwaggerModel;
// e.SwaggerModelProperty = SwaggerModelProperty;
// e.SwaggerResource = SwaggerResource;
e.SwaggerApi = SwaggerApi;