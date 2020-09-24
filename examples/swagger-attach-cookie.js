// this line will set the credentials to "include" instead of "same-origin", as a result a cookie will be attached to the request
SwaggerClient.http.withCredentials = true;

SwaggerClient({
    url: process.env.REACT_APP_SWAGGER_URI.
}).then(_swag => {
    window.ReactAPI = swag;
});
