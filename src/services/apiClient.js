import axios from "axios";
import { encryptPayload, decryptPayload } from "../configs/encryptFernet";
import { config } from "../configs/encrypt.config";

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 100000,
});

// Encrypt request
apiClient.interceptors.request.use(
  (requestConfig) => {
    if (!config.encryption.enabled) {
      return requestConfig;
    }

    try {
      const isFormData = requestConfig.data instanceof FormData;

      if (requestConfig.data && ['post', 'put', 'patch'].includes((requestConfig.method || "").toLowerCase())) {
        if (isFormData) {
          if (requestConfig.headers && requestConfig.headers['Content-Type'] === 'multipart/form-data') {
            delete requestConfig.headers['Content-Type'];
          }
          return requestConfig;
        } else {
          const encryptedData = encryptPayload(requestConfig.data);
          requestConfig.data = encryptedData;
          if (requestConfig.headers) {
            requestConfig.headers['Content-Type'] = 'application/json';
          }
        }
      } else if (requestConfig.params) {
        const encryptedData = encryptPayload(requestConfig.params);
        requestConfig.params = {};
        requestConfig.url = requestConfig.url + "?" + encryptedData;

        if (requestConfig.headers) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }
      }
    } catch (error) {
      console.error("Request encryption error:", error);
      return Promise.reject(error);
    }

    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Decrypt response
apiClient.interceptors.response.use(
  (response) => {
    if (!config.encryption.enabled) {
      return response;
    }

    try {
      const isEncrypted =
        response.headers['Content-Type'] === 'application/json' ||
        (response.data && typeof response.data.data === 'string');

      if (isEncrypted && response.data && response.data.data) {
        const decryptedData = decryptPayload(response.data.data);
        response.data = decryptedData;
      }

      return response;
    } catch (error) {
      console.error("Response decryption error:", error);
      return response;
    }
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { apiClient };
