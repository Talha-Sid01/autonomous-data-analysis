import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Upload, FileText, Activity, Database } from 'lucide-react';
import ChatMessage from './components/ChatMessage';

// Configure Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

function App() {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [messages, setMessages] = useState([
        { text: "Hello! I am your Autonomous Data Analyst. Please upload a specific data file (CSV, Excel, JSON) to get started.", role: 'bot', plot: null }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setUploadStatus('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploadStatus("Uploading...");

        try {
            await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadStatus(`Uploaded: ${file.name}`);
            setMessages(prev => [...prev, { text: `System: Dataset "${file.name}" loaded successfully. I am now ready to analyze it.`, role: 'bot', plot: null }]);
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Upload failed.");
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { text: input, role: 'user', plot: null };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post('/chat', { query: userMessage.text });
            const data = response.data;

            const botMessage = {
                text: data.answer,
                role: 'bot',
                plot: data.plot
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            let errorMsg = "Sorry, something went wrong.";
            if (error.response && error.response.data && error.response.data.detail) {
                errorMsg = `Error: ${error.response.data.detail}`;
            }
            setMessages(prev => [...prev, { text: errorMsg, role: 'bot', plot: null }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col p-6 hidden md:flex">
                {/* Logo Area */}
                <div className="flex items-center space-x-3 mb-10">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white">Data Analyst</h1>
                        <p className="text-xs text-slate-500 font-medium">Autonomous Agent</p>
                    </div>
                </div>

                {/* Dataset Control */}
                <div className="mb-8">
                    <h2 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4 flex items-center">
                        <Database className="w-3 h-3 mr-2" />
                        Active Dataset
                    </h2>

                    <div className="group relative border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer bg-slate-900">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls,.json,.pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                            {file ? file.name : "Drop Data file here"}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">or click to browse</span>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file}
                        className={`mt-4 w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all duration-200 ${file
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 translate-y-0'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Dataset</span>
                    </button>
                    {uploadStatus && (
                        <div className={`text-xs text-center mt-3 font-medium ${uploadStatus.includes('failed') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {uploadStatus}
                        </div>
                    )}
                </div>

                {/* Feature List / Info */}
                <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Capabilities</h3>
                        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                            <li>Exploratory Data Analysis</li>
                            <li>Statistical Summaries</li>
                            <li>Interactive Visualizations</li>
                            <li>Python Code Execution</li>
                        </ul>
                    </div>
                </div>

                <div className="text-[10px] text-slate-600 text-center font-medium tracking-wide uppercase mt-6">
                    Powered by Llama-3 & LangChain v0.2
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-slate-950">
                {/* Header */}
                <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h2 className="text-sm font-medium text-slate-200">Session Active</h2>
                    </div>
                    <div className="md:hidden">
                        {/* Mobile Menu Icon Placeholder */}
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} />
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="bg-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center space-x-1.5 shadow-lg">
                                <span className="text-xs text-slate-400 font-medium mr-2">Analyzing...</span>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-slate-950 border-t border-slate-800/50">
                    <form onSubmit={handleSend} className="relative max-w-4xl mx-auto group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your data..."
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-4 pl-6 pr-14 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-2xl relative z-10 transition-all duration-300"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 z-20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-600 mt-4 tracking-wide font-medium">
                        AI CAN MAKE MISTAKES. PLEASE VERIFY IMPORTANT RESULTS.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
