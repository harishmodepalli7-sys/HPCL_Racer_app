export const config = {
  encryption: {
    enabled: true, // Set to false to disable encryption
    secret: "mcMAmuM2wLgNey7hgaCXDsaH__h13R2esSQ7fKvX3ak=", // Move to env vars in production
    doubleEncode: false // Set true if backend expects double base64 encoding
  },
  api: {
    baseUrl: "https://demo.racer.algofusiontech.com" // or your actual base URL
  }
};
