const foldFormDataToRequest = (formdata, request) => {
  request.body = formdata;
};

export default foldFormDataToRequest;
