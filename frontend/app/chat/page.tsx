"use client";
import React from "react";
import { ChatInterface } from "../components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl h-full flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
