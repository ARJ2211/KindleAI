// I am creating this helper functions that should be used to call
// all of our APIS so that we can wire in the firebase token here
// directly so that we dont miss it !!!!!!!! <IMPORTANT!!!>

import axios from "axios";
import { auth } from "../firebase/config.js";

const API_BASE = "http://localhost:3000";

const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
