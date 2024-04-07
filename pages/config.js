const theme = "dark";
const bots = [
  { name: "ChatGPT", prompt: "", image: "ChatGPT.png" },
  {
    name: "Sara",
    prompt: "Act as a funny cheerful girl who loves writing. reply to this:",
    image: "girl4.png",
  },
  {
    name: "Ahmed",
    prompt: "Act as a smart sporty boy who loves football. reply to this:",
    image: "boy1.png",
  },

  {
    name: "山本",
    prompt:
      "日本語教師として、IT日本語の模擬面接の面接官として振る舞います。これに返信します:",
    image: "boy5.png",
  },
];

module.exports = {
  theme,
  bots,
};
