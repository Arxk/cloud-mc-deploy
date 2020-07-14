exports.makeApiRequest = (config, endpoint, parameters) => {
  const axios = require('axios').default;
  const apiUrl = (config && config.apiUrl)
  let fetchUrl = `${apiUrl}${endpoint.url}`
  const options = {
    method: endpoint.requestType,
    headers: {
      'API-Key': (config && config.apiKey) || ''
    }
  }

  if (parameters !== undefined) {
    const params = new URLSearchParams()
    const userParams = Object.keys(parameters)

    userParams.forEach((key) => {
      params.append(key, parameters[key])
    })

    if (endpoint.requestType === 'POST') {
      options.data = params
    } else if (endpoint.requestType === 'GET') {
      fetchUrl = `${fetchUrl}?${params}`
    }
  }

  return axios(fetchUrl, options)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.statusText)
      }
      return response.data
    })
    .catch(error => {
      return error
    })
}
