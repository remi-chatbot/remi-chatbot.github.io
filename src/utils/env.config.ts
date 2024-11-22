export const envConfig = {
  api: {
    token: localStorage.getItem('acnt::oaiKey'),
  },
  theme_img: {
    base_url: localStorage.getItem('acnt::imgBaseUrl'), 
    //  ?? "https://a-conect.github.io/imgs",
    // theme: JSON.parse(localStorage.getItem('acnt::theme') ?? "") as Theme,
    // base_url: "https://a-conect.github.io/imgs",
  },
  api_token: localStorage.getItem('acnt::api_token') ?? "",
};