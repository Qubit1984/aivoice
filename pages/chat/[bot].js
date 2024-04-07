import Head from "next/head";
import AWS from "aws-sdk";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import {
  ChevronLeft,
  ThreeDotsVertical,
  SendFill,
} from "react-bootstrap-icons";
import { useRouter } from "next/router";
import OpenAI from "openai";
//import "dotenv";
import SideMenu from "../components/SideMenu";
import BotsList from "../components/BotsList";
import Link from "next/link";
import Microphone from "../components/microphone";
//import speakMessage from "../components/Aws";
export default function ChatRoom() {
  const router = useRouter();
  const { bot } = router.query;
  const [botImage, setBotImage] = useState("ChatGPT.png");
  const [botPrompt, setBotPrompt] = useState("");
  const [c1, setc1] = useState("ChatGPT");
  const [userInput, setUserInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isVoiceMessage, setIsVoiceMessage] = useState(false);
  const [isfocused, setIsfocused] = useState(false);
  const myConfig = require("../config");
  const [theme, setTheme] = useState(myConfig.theme);
  const [isMdAndAbove, setIsMdAndAbove] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const [history, setHistory] = useState([]);

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const apiUrl = "http://jp.japanesegrammar.tokyo:3040/v1/chat/completions";

  useEffect(() => {
    const handleResize = () => {
      setIsMdAndAbove(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const matchingBot = myConfig.bots.find((b) => b.name === bot);

    if (matchingBot) {
      setBotImage(matchingBot.image);
      setBotPrompt(matchingBot.prompt);
      setHistory((prevHistory) => [
        ...prevHistory,
        { role: "system", content: matchingBot.prompt },
      ]);
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: botPrompt }],
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          const assistantResponse = data.choices[0].message.content;
          console.log(assistantResponse);
        });
    } else {
      setBotImage("ChatGPT.png");
      setBotPrompt("");
    }
    setChatMessages([]);
  }, [bot]);

  const testx = () => {
    setIsButtonDisabled(true);
  };

  const sendMessage = () => {
    setHistory((prevHistory) => [
      ...prevHistory,
      { role: "user", content: userInput },
    ]);
    const message = `<div class="message user-message">${userInput}</div><div style="clear:both;"></div>`;

    const newTheme = "red";
    setChatMessages((prevMessages) => [...prevMessages, message]);
    setIsloading(true);
    setTimeout(() => {
      const typingIcon = () => {
        return `<span><ThreeDots /></span>`;
      };

      const typingMessage = `
        <div class="message bot-message">
          <div class="typing-animation">
            <span class="dot dot1">&#9679;</span>
            <span class="dot dot2">&#9679;</span>
            <span class="dot dot3">&#9679;</span>
          </div>
        </div>
        <div>
        `;

      setChatMessages((prevMessages) => [...prevMessages, typingMessage]);

      const fetchGeneratedText = async () => {
        const headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        // const messagebefore = chatMessages.chatMessages.slice(-10);
        const messages = [
          {
            role: "user",
            content: botPrompt + "" + userInput,
          },
        ];

        const data = {
          model: "gpt-3.5-turbo",
          messages: history,
          max_tokens: 35,
        };

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const responseData = await response.json();

            if (
              responseData.choices &&
              responseData.choices.length > 0 &&
              responseData.choices[0].message
            ) {
              speakMessage(responseData.choices[0].message.content);
              setHistory((prevHistory) => [
                ...prevHistory,
                {
                  role: "assistant",
                  content: responseData.choices[0].message.content,
                },
              ]);
              const botMessage =
                `<div class="message bot-message">` +
                responseData.choices[0].message.content +
                `</div><div style="clear:both;"></div>`;

              setChatMessages((prevMessages) => [
                ...prevMessages.slice(0, -1),
                botMessage,
              ]);
              setIsVoiceMessage(true);
              setIsloading(false);
            } else {
              const botMessage = `<div class="message bot-message">Error</div><div style="clear:both;"></div>`;
            }

            setIsButtonDisabled(false);
          } else {
            console.error("Error:", response.statusText);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };

      fetchGeneratedText();
    }, 1500);
  };

  const handleSendClick = () => {
    const trimmedInput = userInput.trim();

    if (trimmedInput !== "") {
      sendMessage();
      setUserInput("");
    }
  };
  useEffect(() => {
    if (isVoiceMessage && userInput && !isfocused && !isloading) {
      // 将voice消息设置为输入框的值
      // 自动发送消息

      sendMessage();
      setIsVoiceMessage(false);
      // 重置标志
    }
  }, [userInput]);
  const handleVoiceChange = (voice) => {
    setUserInput(voice);
    setIsVoiceMessage(true);
  };
  const handButtonclicked = () => {
    setIsVoiceMessage(!isVoiceMessage);
  };
  const handleFocus = () => {
    setIsfocused(true);
    setIsVoiceMessage(false);
  };
  const handleBlur = () => {
    setIsfocused(false);
  };

  // 在组件外部创建一个Polly客户端实例
  const polly = new AWS.Polly({
    region: "ap-northeast-1", // 替换为你的AWS区域
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_POLLY_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_POLLY_SECRET_KEY,
    },
  });

  async function speakMessage(message) {
    try {
      const response = await polly
        .synthesizeSpeech({
          Text: message,
          OutputFormat: "mp3",
          VoiceId: "Takumi", // 替换为你喜欢的语音ID
        })
        .promise();

      const arrayBuffer = response.AudioStream.buffer;
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);
      const audioElement = new Audio(blobUrl);

      // 播放音频
      audioElement.play();
    } catch (error) {
      console.error("Error synthesizing speech:", error);
    }
  }
  return (
    <>
      <Head>
        <title>Chat with {bot}</title>
        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      </Head>
      <div className="container-fluid">
        <div className="row">
          {isMdAndAbove && (
            <>
              <SideMenu page="chat" />
              <BotsList />
            </>
          )}
          <div id="right-column" className="col-md-8 p-0 m-0">
            <main>
              <nav
                id="chat-header"
                className="navbar navbar-expand navbar-dark "
              >
                <div className="container-fluid">
                  <h5 className="me-2">
                    <Link href="../chat">
                      <span className="text-light">
                        <ChevronLeft />
                      </span>
                    </Link>
                  </h5>
                  <img className="me-2" src={"/" + botImage} />
                  <a className="navbar-brand" href="#">
                    {bot}
                  </a>
                  <div className="collapse navbar-collapse" id="navbar01"></div>
                </div>
              </nav>
              <div id="chat-messages">
                {chatMessages.map((message, index) => (
                  <div>
                    {" "}
                    <div
                      key={index}
                      dangerouslySetInnerHTML={{ __html: message }}
                    />
                    {/*   <Audio ref /> */}
                  </div>
                ))}
              </div>
              <footer>
                <div className="input-group p-2">
                  <input
                    type="text"
                    id="user-input"
                    className="form-control"
                    placeholder="Type your message..."
                    value={userInput}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  <Microphone onVoiceChange={handleVoiceChange} />
                  <div className="input-group-append">
                    <button
                      onClick={handleSendClick}
                      className="btn btn-primary"
                      id="send-button"
                      disabled={isButtonDisabled}
                    >
                      <SendFill />
                    </button>
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
