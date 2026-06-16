import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

const instance = axios.create({
  baseURL: API_URL,
});

export default instance;

const strapiInstance = axios.create({
  baseURL: STRAPI_URL,
});

export { strapiInstance };