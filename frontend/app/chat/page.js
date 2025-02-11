"use client";
import React, { useState } from "react";
// import { useRouter } from 'next/router';
import Link from "next/link";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [agentMessages, setAgentMessages] = useState([]);
  const [projectManagerMessage, setProjectManagerMessage] = useState("");
  const [taskAssignerMessage, setTaskAssignerMessage] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  // const router = useRouter();

  async function sendPrompt(e) {
    e.preventDefault();
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, project_name: projectName, project_description: projectDescription }),
    });
    const data = await response.json();
    setTasks(data.tasks || []);
    setMessage(data.message || "");
    setAgentMessages(data.agent_messages || []);
    setProjectManagerMessage(data.project_manager_message || "");
    setTaskAssignerMessage(data.task_assigner_message || "");
  }

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col items-center py-12 px-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-8">Create - Project</h1>
      <form onSubmit={sendPrompt} className="w-full max-w-xl bg-white p-6 rounded-lg shadow-lg">
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-lg mb-4"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name..."
        />
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg mb-4"
          rows={2}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Enter project description..."
        />
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
        />
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
        >
          Send
        </button>
      </form>

      {message && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <pre className="whitespace-pre-wrap text-blue-700">{message}</pre>
        </div>
      )}

      {projectManagerMessage && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Project Manager Message</h2>
          <pre className="whitespace-pre-wrap text-gray-700">{projectManagerMessage}</pre>
        </div>
      )}

      {taskAssignerMessage && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Task Assigner Message</h2>
          <pre className="whitespace-pre-wrap text-gray-700">{taskAssignerMessage}</pre>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Task List</h2>
          <ul className="space-y-4">
            {tasks.map((task, idx) => (
              <li key={idx} className="p-4 bg-blue-50 border border-gray-300 rounded-lg shadow-sm">
                <p className="text-lg text-blue-700 font-medium mb-2">{task.task}</p>
                <p className="text-sm text-gray-600 mb-2">Description: {task.description}</p>
                <p className="text-sm text-gray-600">
                  Assigned to: <span className="font-semibold">{task.assigned_to}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {agentMessages.length > 0 && (
        <div className="w-full max-w-4xl mt-8 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Agent Messages</h2>
          <ul className="space-y-4">
            {agentMessages.map((msg, idx) => (
              <li
                key={idx}
                className="p-4 bg-blue-50 border border-gray-300 rounded-lg shadow-sm"
              >
                <p className="text-sm text-gray-600">
                  <strong>{msg.speaker}:</strong> {msg.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="mt-8 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
      >
        <Link href="/"> Go back</Link>
      </button>
    </div>
  );

}
