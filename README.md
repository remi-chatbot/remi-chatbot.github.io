# OpenAI Realtime Console

The OpenAI Realtime Console is intended as an inspector and interactive API reference
for the OpenAI Realtime API. It comes packaged with two utility libraries,
[openai/openai-realtime-api-beta](https://github.com/openai/openai-realtime-api-beta)
that acts as a **Reference Client** (for browser and Node.js) and
[`/src/lib/wavtools`](./src/lib/wavtools) which allows for simple audio
management in the browser.

<img src="/readme/realtime-console-demo.png" width="800" />

# Starting the console

This is a React project created using `create-react-app` that is bundled via Webpack.
Install it by extracting the contents of this package and using;

```shell
$ npm i
```

Start your server with:

```shell
$ npm start
```

It should be available via `localhost:3000`.


A-CONECT features
+ [x] Randomize theme
  + [x] Bug exists. The theme is not consistent between images and sys prompt. The main reason is that the sys is inited before the themeId is generated.
  + [ ] `## getInitialSystemPrompt Topics:  ` will be executed twice
+ [x] Propose topics based on theme
+ [ ] Select topics
+ [x] Display image
+ [ ] Deploy it to github.io
+ [ ] Simplified UI
+ [x] Login page. Authorization for the use and private image access.
+ [X] Allow for public access w/ API
  + [X] The OAI APi is not set correctly. 
+ [ ] Setting page. 
+ [ ] Memory. Not very stable. I used the function call.
+ [x] I-CONECT images with auth.
+ [ ] Mem:0 for more structured memory
+ [ ] Improve the stability of memory. Function call is not stable.
