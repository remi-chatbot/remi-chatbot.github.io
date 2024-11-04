export const envConfig = {
  api: {
    token: localStorage.getItem('oaiKey'),
  },
  theme_img: {
    base_url: localStorage.getItem('imgBaseUrl'), 
    //  ?? "https://a-conect.github.io/imgs",
    // theme: JSON.parse(localStorage.getItem('theme') ?? "") as Theme,
    // base_url: "https://a-conect.github.io/imgs",
  },
  api_token: localStorage.getItem('api_token') ?? "",
};