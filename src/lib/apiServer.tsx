import axios from 'axios';

const API_URL = "https://a-conect-auth.netlify.app/.netlify/functions";

const apiService = {
    getTokens: async (token: string): Promise<any> => {
        try{
            const response = await axios.get(`${API_URL}/remi_oakey`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(`Received my API message: ${response.data.message}`)
            return response.data;
        } catch (error) {
            console.error(`Failed to login. Error: ${error}`)
            return undefined;
        }
    },
};

export default apiService;
