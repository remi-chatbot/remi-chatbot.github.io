import axios from 'axios';

const API_URL = "https://a-conect-auth.netlify.app/.netlify/functions";

const apiService = {
    getTokens: async (apiKey: string): Promise<any> => {
        try {
            const response = await axios.get(`${API_URL}/remi_oakey`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });
            
            if (response.data && response.data.api_key) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error(`Failed to verify API key. Error: ${error}`);
            return undefined;
        }
    },
};

export default apiService;
