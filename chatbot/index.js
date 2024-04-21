import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let messages = [{ role: "system", content: "You are a helpful assistant." }];

export async function init(userMessage) {
  const newMessage = { role: "user", content: userMessage };
  messages.push(newMessage);
  console.log(messages);

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const text = response.choices[0].message.content;
  console.log(text);

  const aiMessage = { role: "system", content: text };
  messages.push(aiMessage);

  console.log(messages);
  return text;
}
