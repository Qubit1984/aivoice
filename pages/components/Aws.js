import AWS from "aws-sdk";

// 在组件外部创建一个Polly客户端实例
const polly = new AWS.Polly({
  region: "ap-northeast-1", // 替换为你的AWS区域
  credentials: {
    accessKeyId: "AKIAQ3EGRHW3KSXIHXGR",
    secretAccessKey: "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",
  },
});

function SpeakMessage(text) {
  const audioRef = useRef(null);

  useEffect(() => {
    const playAudio = async () => {
      try {
        const response = await polly
          .synthesizeSpeech({
            Text: text,
            OutputFormat: "mp3",
            VoiceId: "Joanna",
          })
          .promise();

        const audioBuffer = new Blob([response.AudioStream], {
          type: "audio/mpeg",
        });
        const audioUrl = URL.createObjectURL(audioBuffer);

        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } catch (error) {
        console.error("Error synthesizing speech:", error);
      }
    };

    playAudio();
  }, [text]);

  /* return <audio ref={audioRef} />; */
}

export default SpeakMessage;
