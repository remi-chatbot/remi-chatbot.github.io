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

Deploy to a-connect.github.io with:

```shell
$ npm run deploy
```


A-CONECT features
+ [x] Randomize theme
+ [x] Propose topics based on theme
+ [x] Display image
+ [x] Login page. Authorization for the use and private image access.
+ [X] Allow for public access w/ API
  + [X] The OAI APi is not set correctly. 
+ [x] Memory which will be stored on demand by OpenAI.
+ [x] I-CONECT images with auth.
+ [x] Select one topic
+ [x] Deploy it to github.io and check the latency.
+ [ ] Enable to pause and resume the conversation instead of disconnecting.
+ [x] Simplified UI
  + [x] Add avatar to replace the map.
  + [x] Simplify the buttons.
+ [ ] Detailed memory.

Advanced features:
+ [ ] Mem:0 for more structured memory
+ [ ] Setting page. 
+ [ ] Allow to download conversation.
+ [ ] Provide different characters on the map view.
+ [ ] More details on the character customized by, e.g., the location + weather.
+ [ ] Dynamics to avatar

Issues:
+ [x] The local storage has misleading keys. => unified with `acnt::` prefix.
+ [x] Theme setup
  + [x] Bug exists. The theme is not consistent between images and sys prompt. The main reason is that the sys is inited before the themeId is generated.
  + [x] `## getInitialSystemPrompt Topics:  ` will be executed twice. Not at deployment. (Ignore issue)
  + [x] The bug remains at deployment. The theme is not set. You will see different topics on screen and the chatbot's description.
+ [ ] Fix bugs found by Sam and Hiroko.
+ [ ] Encrypt keys.
+ [ ] When open 'https://a-conect.github.io/chat' directly, there will be 404.
