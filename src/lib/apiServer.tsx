import axios from 'axios';

const API_URL = "https://a-conect-auth.netlify.app/.netlify/functions";

const apiService = {
    getTokens: async (token: string): Promise<any> => {
        try{
            const response = await axios.get(`${API_URL}/vapi`, {
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
    getTheme: async (token: string, themeId: string): Promise<any> => {
        try {
            const response = await axios.get(`${API_URL}/theme`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    themeId: themeId,  // "001",
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
