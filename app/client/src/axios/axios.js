import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export default instance;

const strapiInstance = axios.create({
  baseURL: "http://127.0.0.1:1337",
});

export {strapiInstance};